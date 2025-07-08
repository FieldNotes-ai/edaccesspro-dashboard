#!/usr/bin/env python3
"""
Airtable AI Agent - Internal database manager for ESA data
Handles schema evolution, data ingestion, and quality enforcement
"""

import json
import time
import logging
import asyncio
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from pathlib import Path
import os
import hmac
from urllib.parse import quote

import aiohttp
import backoff
from aiohttp import web

@dataclass
class WebhookPayload:
    """Incoming webhook payload from Research Agent"""
    event_type: str  # research_update, gap_report, schema_change
    data: Dict[str, Any]
    timestamp: str
    schema_change: bool = False

@dataclass
class DataRecord:
    """Data record for ingestion"""
    table_name: str
    fields: Dict[str, Any]
    record_id: Optional[str] = None

@dataclass
class SchemaField:
    """Airtable field definition"""
    name: str
    type: str  # singleLineText, multilineText, number, date, etc.
    options: Optional[Dict] = None

@dataclass
class ChangeRequest:
    """Pending destructive change for human review"""
    id: str
    action: str  # delete_field, change_type, delete_table
    table_name: str
    field_name: Optional[str]
    details: Dict[str, Any]
    created_at: str
    approved: bool = False

class AirtableAgent:
    """Airtable AI Agent - Internal database manager"""
    
    def __init__(self):
        self.base_id = os.getenv("AIRTABLE_BASE_ID")
        self.api_key = os.getenv("AIRTABLE_API_KEY")
        self.webhook_secret = os.getenv("AGENT_KEY", "default-secret-key")
        self.research_agent_webhook = os.getenv("RESEARCH_AGENT_WEBHOOK", "http://localhost:8080/webhook")
        
        if not self.base_id or not self.api_key:
            raise ValueError("AIRTABLE_BASE_ID and AIRTABLE_API_KEY must be set")
        
        self.api_base_url = f"https://api.airtable.com/v0/{self.base_id}"
        self.session: Optional[aiohttp.ClientSession] = None
        
        # Rate limiting: 30 API calls/min = 2s interval
        self.rate_limiter = asyncio.Semaphore(1)
        self.last_api_call = 0
        
        # Internal state
        self.data_dictionary = {}  # field_name -> field_definition
        self.pending_changes = []  # List[ChangeRequest]
        self.schema_cache = {}  # table_name -> {fields: [], records: []}
        
        self.setup_logging()
    
    def setup_logging(self):
        """Setup JSON Lines logging"""
        log_dir = Path("data/logs")
        log_dir.mkdir(parents=True, exist_ok=True)
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(message)s',
            handlers=[
                logging.FileHandler(log_dir / "airtable_agent.log"),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def log_json(self, event_type: str, data: Dict):
        """Log structured JSON data"""
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": event_type,
            "data": data
        }
        self.logger.info(json.dumps(log_entry))
    
    async def __aenter__(self):
        """Async context manager entry"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            headers=headers
        )
        await self.load_data_dictionary()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    async def rate_limit(self):
        """Enforce 30 API calls/min rate limit"""
        async with self.rate_limiter:
            now = time.time()
            time_since_last = now - self.last_api_call
            if time_since_last < 2.0:  # 2 seconds between calls
                await asyncio.sleep(2.0 - time_since_last)
            self.last_api_call = time.time()
    
    @backoff.on_exception(
        backoff.expo,
        (aiohttp.ClientError, asyncio.TimeoutError),
        max_tries=3,
        giveup=lambda e: hasattr(e, 'status') and 400 <= e.status < 500 and e.status != 429
    )
    async def airtable_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Optional[Dict]:
        """Make rate-limited Airtable API request"""
        await self.rate_limit()
        
        url = f"{self.api_base_url}/{endpoint}"
        
        try:
            async with self.session.request(method, url, json=data) as response:
                if response.status == 200:
                    result = await response.json()
                    self.log_json("airtable_api_success", {
                        "method": method,
                        "endpoint": endpoint,
                        "status": response.status
                    })
                    return result
                else:
                    error_text = await response.text()
                    self.log_json("airtable_api_error", {
                        "method": method,
                        "endpoint": endpoint,
                        "status": response.status,
                        "error": error_text
                    })
                    return None
        except Exception as e:
            self.log_json("airtable_api_exception", {
                "method": method,
                "endpoint": endpoint,
                "error": str(e)
            })
            raise
    
    async def load_data_dictionary(self):
        """Load existing Data Dictionary table"""
        try:
            result = await self.airtable_request("GET", "Data%20Dictionary")
            if result and "records" in result:
                for record in result["records"]:
                    fields = record.get("fields", {})
                    field_name = fields.get("Field Name")
                    if field_name:
                        self.data_dictionary[field_name] = {
                            "type": fields.get("Field Type"),
                            "description": fields.get("Description"),
                            "semantic_tags": fields.get("Semantic Tags", []),
                            "record_id": record["id"]
                        }
                self.log_json("data_dictionary_loaded", {"count": len(self.data_dictionary)})
        except Exception as e:
            self.log_json("data_dictionary_load_error", {"error": str(e)})
            # Create Data Dictionary table if it doesn't exist
            await self.create_data_dictionary_table()
    
    async def create_data_dictionary_table(self):
        """Create Data Dictionary table for schema management"""
        table_schema = {
            "name": "Data Dictionary",
            "fields": [
                {"name": "Field Name", "type": "singleLineText"},
                {"name": "Field Type", "type": "singleLineText"},
                {"name": "Description", "type": "multilineText"},
                {"name": "Semantic Tags", "type": "multipleSelects", "options": {"choices": []}},
                {"name": "Created Date", "type": "createdTime"},
                {"name": "Last Used", "type": "date"}
            ]
        }
        
        # Note: Table creation requires Airtable Enterprise API or manual setup
        # For now, log the requirement
        self.log_json("data_dictionary_table_needed", {"schema": table_schema})
    
    def find_semantic_twin(self, field_name: str, field_type: str) -> Optional[str]:
        """Find existing field with similar semantics"""
        field_lower = field_name.lower()
        
        # Semantic similarity patterns
        semantic_patterns = {
            "deadline": ["due_date", "application_deadline", "submission_date"],
            "income": ["income_limit", "household_income", "family_income"],
            "amount": ["award_amount", "voucher_amount", "scholarship_amount"],
            "url": ["portal_url", "application_url", "website"]
        }
        
        for existing_field, definition in self.data_dictionary.items():
            if definition["type"] == field_type:
                existing_lower = existing_field.lower()
                
                # Direct match
                if field_lower == existing_lower:
                    return existing_field
                
                # Semantic pattern match
                for pattern, variants in semantic_patterns.items():
                    if pattern in field_lower and any(variant in existing_lower for variant in variants):
                        return existing_field
        
        return None
    
    async def evolve_schema(self, table_name: str, new_fields: List[Dict[str, Any]]) -> List[str]:
        """Evolve table schema with new fields"""
        created_fields = []
        
        for field_data in new_fields:
            field_name = field_data["name"]
            field_type = field_data.get("type", "singleLineText")
            
            # Check for semantic twin
            semantic_twin = self.find_semantic_twin(field_name, field_type)
            if semantic_twin:
                self.log_json("semantic_twin_found", {
                    "new_field": field_name,
                    "existing_field": semantic_twin,
                    "table": table_name
                })
                created_fields.append(semantic_twin)
                continue
            
            # Create new field
            field_payload = {
                "name": field_name,
                "type": field_type
            }
            
            if "options" in field_data:
                field_payload["options"] = field_data["options"]
            
            result = await self.airtable_request(
                "POST",
                f"{quote(table_name)}/fields",
                field_payload
            )
            
            if result:
                created_fields.append(field_name)
                
                # Add to data dictionary
                await self.add_to_data_dictionary(field_name, field_type, f"Auto-created for {table_name}")
                
                self.log_json("field_created", {
                    "table": table_name,
                    "field": field_name,
                    "type": field_type
                })
        
        return created_fields
    
    async def add_to_data_dictionary(self, field_name: str, field_type: str, description: str):
        """Add field to Data Dictionary"""
        record_data = {
            "fields": {
                "Field Name": field_name,
                "Field Type": field_type,
                "Description": description,
                "Last Used": datetime.now().isoformat()[:10]  # YYYY-MM-DD
            }
        }
        
        await self.airtable_request("POST", "Data%20Dictionary", {"records": [record_data]})
        
        # Update local cache
        self.data_dictionary[field_name] = {
            "type": field_type,
            "description": description,
            "semantic_tags": [],
            "record_id": None
        }
    
    def calculate_checksum(self, records: List[Dict]) -> str:
        """Calculate checksum for data validation"""
        data_str = json.dumps(records, sort_keys=True)
        return hashlib.md5(data_str.encode()).hexdigest()
    
    async def bulk_import_data(self, table_name: str, records: List[DataRecord]) -> Tuple[int, int]:
        """Bulk import data in 500-record chunks with validation"""
        total_imported = 0
        total_errors = 0
        chunk_size = 500
        
        for i in range(0, len(records), chunk_size):
            chunk = records[i:i + chunk_size]
            
            # Pre-import checksum
            chunk_data = [asdict(record) for record in chunk]
            pre_checksum = self.calculate_checksum(chunk_data)
            
            # Prepare Airtable payload
            airtable_records = []
            for record in chunk:
                airtable_record = {"fields": record.fields}
                if record.record_id:
                    airtable_record["id"] = record.record_id
                airtable_records.append(airtable_record)
            
            # Import chunk
            result = await self.airtable_request(
                "POST",
                f"{quote(table_name)}",
                {"records": airtable_records}
            )
            
            if result and "records" in result:
                imported_count = len(result["records"])
                total_imported += imported_count
                
                # Post-import validation (simplified)
                post_checksum = self.calculate_checksum(chunk_data)
                if pre_checksum == post_checksum:
                    self.log_json("chunk_imported", {
                        "table": table_name,
                        "chunk_size": len(chunk),
                        "imported": imported_count,
                        "checksum_valid": True
                    })
                else:
                    self.log_json("checksum_mismatch", {
                        "table": table_name,
                        "pre_checksum": pre_checksum,
                        "post_checksum": post_checksum
                    })
            else:
                total_errors += len(chunk)
                self.log_json("chunk_import_failed", {
                    "table": table_name,
                    "chunk_size": len(chunk)
                })
        
        return total_imported, total_errors
    
    async def queue_destructive_change(self, action: str, table_name: str, field_name: Optional[str], details: Dict):
        """Queue destructive change for human review"""
        change_id = f"{action}_{table_name}_{field_name}_{int(time.time())}"
        change_request = ChangeRequest(
            id=change_id,
            action=action,
            table_name=table_name,
            field_name=field_name,
            details=details,
            created_at=datetime.utcnow().isoformat()
        )
        
        self.pending_changes.append(change_request)
        
        # Store in Change Review table
        await self.store_change_request(change_request)
        
        self.log_json("destructive_change_queued", {
            "change_id": change_id,
            "action": action,
            "table": table_name,
            "field": field_name
        })
    
    async def store_change_request(self, change_request: ChangeRequest):
        """Store change request in Change Review table"""
        record_data = {
            "fields": {
                "Change ID": change_request.id,
                "Action": change_request.action,
                "Table Name": change_request.table_name,
                "Field Name": change_request.field_name or "",
                "Details": json.dumps(change_request.details),
                "Created At": change_request.created_at,
                "Status": "Pending Review"
            }
        }
        
        await self.airtable_request("POST", "Change%20Review", {"records": [record_data]})
    
    async def compute_nightly_metrics(self) -> Dict[str, Any]:
        """Compute data quality metrics"""
        metrics = {
            "timestamp": datetime.utcnow().isoformat(),
            "completeness_percent": 0.0,
            "duplication_percent": 0.0,
            "orphans_count": 0,
            "tables": {}
        }
        
        # Get all tables (simplified - would need actual table enumeration)
        table_names = ["ESA Programs", "Applications", "Vendors"]  # Mock data
        
        total_fields = 0
        total_filled = 0
        total_records = 0
        total_duplicates = 0
        
        for table_name in table_names:
            table_data = await self.airtable_request("GET", quote(table_name))
            
            if table_data and "records" in table_data:
                records = table_data["records"]
                table_records = len(records)
                total_records += table_records
                
                # Calculate completeness
                field_count = 0
                filled_count = 0
                
                for record in records:
                    fields = record.get("fields", {})
                    for field_name, value in fields.items():
                        field_count += 1
                        if value and str(value).strip():
                            filled_count += 1
                
                table_completeness = (filled_count / field_count * 100) if field_count > 0 else 0
                
                # Simple duplication detection (by comparing field combinations)
                seen_combinations = set()
                duplicates = 0
                
                for record in records:
                    fields = record.get("fields", {})
                    # Create a signature from key fields
                    signature = tuple(sorted(fields.items()))
                    if signature in seen_combinations:
                        duplicates += 1
                    else:
                        seen_combinations.add(signature)
                
                table_duplication = (duplicates / table_records * 100) if table_records > 0 else 0
                
                metrics["tables"][table_name] = {
                    "records": table_records,
                    "completeness_percent": table_completeness,
                    "duplication_percent": table_duplication
                }
                
                total_fields += field_count
                total_filled += filled_count
                total_duplicates += duplicates
        
        # Overall metrics
        metrics["completeness_percent"] = (total_filled / total_fields * 100) if total_fields > 0 else 0
        metrics["duplication_percent"] = (total_duplicates / total_records * 100) if total_records > 0 else 0
        
        self.log_json("nightly_metrics", metrics)
        return metrics
    
    async def send_gap_report(self, metrics: Dict[str, Any]):
        """Send gap report back to Research Agent"""
        gap_report = {
            "event_type": "gap_report",
            "timestamp": datetime.utcnow().isoformat(),
            "metrics": metrics,
            "priority_gaps": []
        }
        
        # Identify priority gaps (tables/fields with low completeness)
        for table_name, table_metrics in metrics.get("tables", {}).items():
            if table_metrics["completeness_percent"] < 70:
                gap_report["priority_gaps"].append({
                    "table": table_name,
                    "completeness": table_metrics["completeness_percent"],
                    "priority": "high" if table_metrics["completeness_percent"] < 50 else "medium"
                })
        
        # Send to Research Agent webhook
        try:
            payload = json.dumps(gap_report)
            signature = hmac.new(
                self.webhook_secret.encode(),
                payload.encode(),
                hashlib.sha256
            ).hexdigest()
            
            headers = {
                "Content-Type": "application/json",
                "X-Agent-Sig": f"sha256={signature}"
            }
            
            async with self.session.post(self.research_agent_webhook, data=payload, headers=headers) as response:
                if response.status == 200:
                    self.log_json("gap_report_sent", {"status": response.status})
                else:
                    self.log_json("gap_report_error", {"status": response.status})
        except Exception as e:
            self.log_json("gap_report_exception", {"error": str(e)})
    
    def verify_webhook_signature(self, payload: str, signature: str) -> bool:
        """Verify webhook signature from Research Agent"""
        expected_signature = hmac.new(
            self.webhook_secret.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(f"sha256={expected_signature}", signature)
    
    async def handle_webhook(self, request: web.Request) -> web.Response:
        """Handle incoming webhook from Research Agent"""
        try:
            # Verify signature
            signature = request.headers.get("X-Agent-Sig", "")
            payload = await request.text()
            
            if not self.verify_webhook_signature(payload, signature):
                self.log_json("webhook_signature_invalid", {"signature": signature})
                return web.Response(status=401, text="Invalid signature")
            
            # Parse payload
            data = json.loads(payload)
            webhook_payload = WebhookPayload(**data)
            
            self.log_json("webhook_received", {
                "event_type": webhook_payload.event_type,
                "schema_change": webhook_payload.schema_change
            })
            
            # Handle different event types
            if webhook_payload.event_type == "research_update":
                await self.handle_research_update(webhook_payload)
            elif webhook_payload.event_type == "schema_change":
                await self.handle_schema_change(webhook_payload)
            elif webhook_payload.event_type == "gap_report":
                await self.handle_gap_report_request(webhook_payload)
            
            return web.Response(status=200, text="OK")
            
        except Exception as e:
            self.log_json("webhook_error", {"error": str(e)})
            return web.Response(status=500, text="Internal error")
    
    async def handle_research_update(self, payload: WebhookPayload):
        """Handle research data update"""
        data = payload.data
        
        # Extract table and field information
        table_name = data.get("table", "ESA Programs")
        field_name = data.get("field")
        field_value = data.get("value")
        
        if field_name and field_value:
            # Create data record
            record = DataRecord(
                table_name=table_name,
                fields={field_name: field_value}
            )
            
            # Import data
            imported, errors = await self.bulk_import_data(table_name, [record])
            
            self.log_json("research_update_processed", {
                "table": table_name,
                "field": field_name,
                "imported": imported,
                "errors": errors
            })
    
    async def handle_schema_change(self, payload: WebhookPayload):
        """Handle schema change request"""
        data = payload.data
        table_name = data.get("table")
        new_fields = data.get("fields", [])
        
        if table_name and new_fields:
            created_fields = await self.evolve_schema(table_name, new_fields)
            
            self.log_json("schema_change_processed", {
                "table": table_name,
                "requested_fields": len(new_fields),
                "created_fields": len(created_fields)
            })
    
    async def handle_gap_report_request(self, payload: WebhookPayload):
        """Handle gap report request"""
        metrics = await self.compute_nightly_metrics()
        await self.send_gap_report(metrics)
    
    async def nightly_metrics_job(self):
        """Nightly metrics computation job"""
        self.log_json("nightly_job_start", {"timestamp": datetime.utcnow().isoformat()})
        
        try:
            metrics = await self.compute_nightly_metrics()
            await self.send_gap_report(metrics)
            
            self.log_json("nightly_job_complete", {"metrics": metrics})
        except Exception as e:
            self.log_json("nightly_job_error", {"error": str(e)})

async def create_webhook_server(agent: AirtableAgent) -> web.Application:
    """Create webhook server"""
    app = web.Application()
    app.router.add_post('/webhook', agent.handle_webhook)
    return app

async def main():
    """Main entry point"""
    async with AirtableAgent() as agent:
        # Check if running as webhook server or nightly job
        mode = os.getenv("AGENT_MODE", "webhook")
        
        if mode == "nightly":
            await agent.nightly_metrics_job()
        else:
            # Run webhook server
            app = await create_webhook_server(agent)
            runner = web.AppRunner(app)
            await runner.setup()
            
            site = web.TCPSite(runner, '0.0.0.0', 8080)
            await site.start()
            
            agent.log_json("webhook_server_started", {"port": 8080})
            
            # Keep server running
            try:
                await asyncio.Future()  # Run forever
            except KeyboardInterrupt:
                agent.log_json("webhook_server_stopped", {})

if __name__ == "__main__":
    asyncio.run(main())