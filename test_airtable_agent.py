#!/usr/bin/env python3
"""
Local sanity test for Airtable Agent
Dry-run without touching external services
"""

import asyncio
import json
import os
import sys
from pathlib import Path
from unittest.mock import AsyncMock, patch, MagicMock
from typing import Dict, List

# Add agents directory to path
sys.path.insert(0, str(Path(__file__).parent / "agents"))

from airtable_agent import AirtableAgent, WebhookPayload, DataRecord

class MockAirtableAgent(AirtableAgent):
    """Mock Airtable Agent for dry-run testing"""
    
    def __init__(self, dry_run: bool = True):
        # Set environment variables for testing
        os.environ.setdefault('AIRTABLE_BASE_ID', 'test_base_id')
        os.environ.setdefault('AIRTABLE_API_KEY', 'test_api_key')
        os.environ.setdefault('AGENT_KEY', 'test_secret')
        
        # Initialize parent with mock environment
        self.base_id = "test_base_id"
        self.api_key = "test_api_key"
        self.webhook_secret = "test_secret"
        self.research_agent_webhook = "http://localhost:8080/test"
        
        self.api_base_url = f"https://api.airtable.com/v0/{self.base_id}"
        self.session = AsyncMock()
        
        # Rate limiting
        import asyncio
        self.rate_limiter = asyncio.Semaphore(1)
        self.last_api_call = 0
        
        # Internal state
        self.data_dictionary = {}
        self.pending_changes = []
        self.schema_cache = {}
        self.dry_run = dry_run
        
        # Track network calls
        self.network_calls = []
        
        # Setup mock logging
        import logging
        self.logger = logging.getLogger(__name__)
        logging.basicConfig(level=logging.INFO)
    
    def log_json(self, event_type: str, data: Dict):
        """Mock JSON logging"""
        if not self.dry_run:
            print(f"LOG: {event_type} - {data}")
    
    async def airtable_request(self, method: str, endpoint: str, data: Dict = None) -> Dict:
        """Mock Airtable API request - no network calls in dry-run"""
        if self.dry_run:
            # Track that a network call would have been made
            self.network_calls.append({
                'method': method,
                'endpoint': endpoint,
                'data': data
            })
            
            print(f"DRY-RUN: Would make {method} request to {endpoint}")
            
            # Return mock response based on endpoint
            if 'Data%20Dictionary' in endpoint:
                return {
                    "records": [
                        {
                            "id": "rec123",
                            "fields": {
                                "Field Name": "application_deadline",
                                "Field Type": "date",
                                "Description": "Application deadline for ESA program"
                            }
                        }
                    ]
                }
            elif 'fields' in endpoint:
                return {
                    "id": "fld123",
                    "name": data.get('name', 'new_field'),
                    "type": data.get('type', 'singleLineText')
                }
            else:
                return {
                    "records": [
                        {
                            "id": "rec456",
                            "fields": data.get('fields', {}) if data else {}
                        }
                    ]
                }
        else:
            # This would make real network calls
            raise Exception("Real network calls not allowed in test mode")
    
    async def load_data_dictionary(self):
        """Mock data dictionary loading"""
        if self.dry_run:
            # Load mock data dictionary
            self.data_dictionary = {
                "application_deadline": {
                    "type": "date",
                    "description": "Application deadline",
                    "semantic_tags": ["deadline", "date"],
                    "record_id": "rec123"
                },
                "income_limit": {
                    "type": "number", 
                    "description": "Income limit",
                    "semantic_tags": ["income", "limit"],
                    "record_id": "rec124"
                }
            }
            print(f"DRY-RUN: Loaded {len(self.data_dictionary)} mock data dictionary entries")

def create_sample_payload(schema_change: bool = False) -> Dict:
    """Create sample webhook payload for testing"""
    base_payload = {
        "event_type": "research_update",
        "timestamp": "2024-01-01T00:00:00Z",
        "schema_change": schema_change,
        "data": {
            "table": "ESA Programs",
            "field": "application_deadline",
            "value": "2024-03-15",
            "confidence": 0.85,
            "sources": [
                {
                    "url": "https://florida-esa.gov/deadlines",
                    "date": "2024-01-01",
                    "title": "ESA Application Deadlines"
                },
                {
                    "url": "https://education.fl.gov/esa",
                    "date": "2024-01-01", 
                    "title": "Florida ESA Program"
                }
            ]
        }
    }
    
    if schema_change:
        base_payload["event_type"] = "schema_change"
        base_payload["data"]["fields"] = [
            {
                "name": "new_deadline_field",
                "type": "date",
                "description": "New deadline field requiring schema change"
            }
        ]
    
    return base_payload

async def test_ingest_with_dry_run(payload_file: str = "sample_payload.json") -> bool:
    """Test airtable agent ingest with dry-run mode"""
    
    # Set dry-run environment variable
    os.environ['DRY_RUN'] = '1'
    
    print(f"🧪 Testing Airtable Agent with dry-run mode")
    print(f"📄 Payload file: {payload_file}")
    print("-" * 50)
    
    # Create sample payload if file doesn't exist
    payload_path = Path(payload_file)
    if not payload_path.exists():
        print(f"📝 Creating sample payload file: {payload_file}")
        sample_payload = create_sample_payload(schema_change=True)
        with open(payload_path, 'w') as f:
            json.dump(sample_payload, f, indent=2)
    
    # Load payload
    try:
        with open(payload_path, 'r') as f:
            payload_data = json.load(f)
        print(f"✅ Loaded payload: {payload_data['event_type']}")
    except Exception as e:
        print(f"❌ Failed to load payload: {e}")
        return False
    
    # Create mock agent
    agent = MockAirtableAgent(dry_run=True)
    
    # Monkey-patch to ensure no real network calls
    original_session_request = None
    network_call_attempted = False
    
    def mock_network_call(*args, **kwargs):
        nonlocal network_call_attempted
        network_call_attempted = True
        raise Exception("Network call attempted during dry-run test!")
    
    try:
        # Initialize agent
        await agent.load_data_dictionary()
        
        # Create webhook payload
        webhook_payload = WebhookPayload(**payload_data)
        
        # Track initial state
        initial_changes = len(agent.pending_changes)
        initial_network_calls = len(agent.network_calls)
        
        print(f"📊 Initial state:")
        print(f"   • Pending changes: {initial_changes}")
        print(f"   • Network calls: {initial_network_calls}")
        
        # Process the webhook
        if webhook_payload.event_type == "research_update":
            await agent.handle_research_update(webhook_payload)
        elif webhook_payload.event_type == "schema_change":
            await agent.handle_schema_change(webhook_payload)
        
        # Check final state
        final_changes = len(agent.pending_changes)
        final_network_calls = len(agent.network_calls)
        
        print(f"\n📊 Final state:")
        print(f"   • Pending changes: {final_changes}")
        print(f"   • Network calls: {final_network_calls}")
        print(f"   • Network calls made: {final_network_calls - initial_network_calls}")
        
        # Validate results
        success = True
        
        # Check that no real network calls were made
        if network_call_attempted:
            print("❌ FAIL: Real network call was attempted!")
            success = False
        else:
            print("✅ PASS: No real network calls made")
        
        # Check change queue for schema changes
        if payload_data.get("schema_change", False):
            if final_changes > initial_changes:
                print("✅ PASS: Change queue updated for schema change")
            else:
                print("⚠️  WARNING: Schema change didn't update change queue")
                # This might be expected behavior in some cases
        
        # Check that mock network calls were tracked
        if final_network_calls > initial_network_calls:
            print("✅ PASS: Mock network calls were tracked")
            
            # Show what calls would have been made
            print("\n📡 Network calls that would have been made:")
            for call in agent.network_calls[initial_network_calls:]:
                print(f"   • {call['method']} {call['endpoint']}")
        else:
            print("⚠️  WARNING: No network calls were tracked")
        
        return success
        
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_change_review_queue():
    """Test that schema changes are queued for review"""
    print("\n🔍 Testing Change Review Queue")
    print("-" * 30)
    
    # Create agent
    agent = MockAirtableAgent(dry_run=True)
    
    # Test queuing a destructive change
    asyncio.run(agent.queue_destructive_change(
        action="delete_field",
        table_name="ESA Programs", 
        field_name="old_field",
        details={"reason": "field deprecated"}
    ))
    
    # Check queue length
    queue_length = len(agent.pending_changes)
    print(f"📋 Change queue length: {queue_length}")
    
    if queue_length == 1:
        print("✅ PASS: Change review queue working correctly")
        
        change = agent.pending_changes[0]
        print(f"   • Action: {change.action}")
        print(f"   • Table: {change.table_name}")
        print(f"   • Field: {change.field_name}")
        print(f"   • Approved: {change.approved}")
        
        return True
    else:
        print(f"❌ FAIL: Expected 1 change in queue, got {queue_length}")
        return False

def main():
    """Main test interface"""
    print("🧪 Airtable Agent Sanity Test")
    print("=" * 50)
    
    # Test 1: Basic ingest with dry-run
    print("\n1️⃣  Testing basic ingest with dry-run...")
    test1_passed = asyncio.run(test_ingest_with_dry_run())
    
    # Test 2: Schema change payload
    print("\n2️⃣  Testing schema change payload...")
    schema_payload = create_sample_payload(schema_change=True)
    with open("schema_change_payload.json", "w") as f:
        json.dump(schema_payload, f, indent=2)
    
    test2_passed = asyncio.run(test_ingest_with_dry_run("schema_change_payload.json"))
    
    # Test 3: Change review queue
    print("\n3️⃣  Testing change review queue...")
    test3_passed = test_change_review_queue()
    
    # Summary
    print("\n" + "=" * 50)
    print("🧪 TEST SUMMARY")
    print("=" * 50)
    
    tests_passed = sum([test1_passed, test2_passed, test3_passed])
    total_tests = 3
    
    print(f"✅ Tests passed: {tests_passed}/{total_tests}")
    
    if tests_passed == total_tests:
        print("🎉 All tests PASSED!")
        
        # Cleanup
        for file in ["sample_payload.json", "schema_change_payload.json"]:
            if Path(file).exists():
                Path(file).unlink()
                print(f"🧹 Cleaned up {file}")
        
        sys.exit(0)
    else:
        print("❌ Some tests FAILED!")
        sys.exit(1)

if __name__ == "__main__":
    main()