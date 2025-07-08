#!/usr/bin/env python3
"""
Research AI Agent - External investigator for ESA data discovery and verification
Lean spec v2 - Dual-agent architecture with Airtable AI partner
"""

import json
import time
import hmac
import hashlib
import logging
import asyncio
import aiohttp
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
from urllib.parse import urljoin, urlparse
import re
import os
from pathlib import Path

# Rate limiting
from asyncio import Semaphore
import backoff

@dataclass
class ResearchRecord:
    """Output format for research findings"""
    field: str
    value: str
    confidence: float
    sources: List[Dict[str, str]]  # [{"url": str, "date": str, "title": str}]

@dataclass
class ESAProgram:
    """ESA Program with priority scoring components"""
    id: str
    name: str
    eligible_student_count: int = 0
    vendor_critical_fields_empty: int = 0
    vendor_critical_fields_total: int = 0
    policy_updates_90d: int = 0
    portal_complexity: float = 0.0  # 0=PDF, 1=REST+OAuth
    is_emerging: bool = False
    
    def calculate_priority_score(self, max_students: int, max_updates: int) -> float:
        """Calculate composite PriorityScore (0-1)"""
        # NormalizedMarketSize (0-1)
        market_size = self.eligible_student_count / max_students if max_students > 0 else 0
        
        # RequirementsGap (0-1) - share of empty/low-confidence fields
        req_gap = self.vendor_critical_fields_empty / self.vendor_critical_fields_total if self.vendor_critical_fields_total > 0 else 0
        
        # ChangeFrequency (0-1)
        change_freq = self.policy_updates_90d / max_updates if max_updates > 0 else 0
        
        # PortalComplexity (0-1)
        portal_complexity = self.portal_complexity
        
        # Base score (weighted average)
        base_score = (market_size * 0.3 + req_gap * 0.3 + change_freq * 0.2 + portal_complexity * 0.2)
        
        # +0.15 bonus for emerging programs
        bonus = 0.15 if self.is_emerging else 0.0
        
        return min(1.0, base_score + bonus)

class ResearchAgent:
    """Research AI Agent - External ESA data investigator"""
    
    def __init__(self):
        self.webhook_url = "https://webhook.site/placeholder"
        self.agent_key = os.getenv("AGENT_KEY", "default-secret-key")
        self.rate_limiter = Semaphore(30)  # 30 requests per minute
        self.session: Optional[aiohttp.ClientSession] = None
        
        # Crawl limits
        self.max_hops_per_seed = 3
        self.max_pages_per_cycle = 50
        self.pages_crawled = 0
        
        # Setup logging
        self.setup_logging()
        
        # Source validation
        self.crawled_urls = set()
        self.source_cache = {}  # URL -> {content, date, title}
        
    def setup_logging(self):
        """Setup JSON Lines logging"""
        log_dir = Path("data/logs")
        log_dir.mkdir(parents=True, exist_ok=True)
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(message)s',
            handlers=[
                logging.FileHandler(log_dir / "research_agent.log"),
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
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            headers={"User-Agent": "ESA-Research-Agent/1.0"}
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    @backoff.on_exception(
        backoff.expo,
        (aiohttp.ClientError, asyncio.TimeoutError),
        max_tries=3,
        giveup=lambda e: hasattr(e, 'status') and 400 <= e.status < 500 and e.status != 429
    )
    async def fetch_url(self, url: str) -> Optional[Dict[str, str]]:
        """Fetch URL with rate limiting and retry logic"""
        if self.pages_crawled >= self.max_pages_per_cycle:
            self.log_json("crawl_limit_reached", {"max_pages": self.max_pages_per_cycle})
            return None
            
        async with self.rate_limiter:
            try:
                await asyncio.sleep(2)  # Rate limiting: 30 req/min = 2s interval
                
                async with self.session.get(url) as response:
                    if response.status == 200:
                        content = await response.text()
                        self.pages_crawled += 1
                        
                        # Extract title
                        title_match = re.search(r'<title[^>]*>([^<]+)</title>', content, re.IGNORECASE)
                        title = title_match.group(1).strip() if title_match else url
                        
                        result = {
                            "url": url,
                            "content": content,
                            "title": title,
                            "date": datetime.now().isoformat(),
                            "status": response.status
                        }
                        
                        self.source_cache[url] = result
                        self.log_json("page_fetched", {"url": url, "title": title, "status": response.status})
                        return result
                    else:
                        self.log_json("fetch_error", {"url": url, "status": response.status})
                        return None
                        
            except Exception as e:
                self.log_json("fetch_exception", {"url": url, "error": str(e)})
                raise
    
    async def crawl_with_hops(self, seed_url: str, max_hops: int = 3) -> List[Dict[str, str]]:
        """Crawl starting from seed URL with hop limit"""
        crawled_pages = []
        urls_to_crawl = [(seed_url, 0)]  # (url, hop_count)
        
        while urls_to_crawl and self.pages_crawled < self.max_pages_per_cycle:
            url, hop_count = urls_to_crawl.pop(0)
            
            if url in self.crawled_urls or hop_count > max_hops:
                continue
                
            self.crawled_urls.add(url)
            page_data = await self.fetch_url(url)
            
            if page_data:
                crawled_pages.append(page_data)
                
                # Extract links for next hop (if within limit)
                if hop_count < max_hops:
                    links = self.extract_links(page_data["content"], url)
                    for link in links[:5]:  # Limit links per page
                        if link not in self.crawled_urls:
                            urls_to_crawl.append((link, hop_count + 1))
        
        return crawled_pages
    
    def extract_links(self, html_content: str, base_url: str) -> List[str]:
        """Extract relevant links from HTML content"""
        links = []
        link_pattern = r'<a[^>]+href=["\']([^"\']+)["\'][^>]*>'
        
        for match in re.finditer(link_pattern, html_content, re.IGNORECASE):
            href = match.group(1)
            
            # Convert relative URLs to absolute
            if href.startswith('/'):
                parsed_base = urlparse(base_url)
                href = f"{parsed_base.scheme}://{parsed_base.netloc}{href}"
            elif not href.startswith(('http://', 'https://')):
                href = urljoin(base_url, href)
            
            # Filter relevant links (ESA, education, policy related)
            if self.is_relevant_link(href):
                links.append(href)
        
        return links
    
    def is_relevant_link(self, url: str) -> bool:
        """Check if URL is relevant for ESA research"""
        relevant_keywords = [
            'esa', 'education', 'scholarship', 'voucher', 'school', 'choice',
            'policy', 'portal', 'application', 'eligibility', 'requirements'
        ]
        
        url_lower = url.lower()
        return any(keyword in url_lower for keyword in relevant_keywords)
    
    def validate_dual_source(self, field: str, value: str, sources: List[Dict]) -> Tuple[bool, float]:
        """Validate value with dual-source requirement"""
        if len(sources) < 2:
            return False, 0.0
        
        # Check source dates (≤12 months old)
        cutoff_date = datetime.now() - timedelta(days=365)
        valid_sources = []
        
        for source in sources:
            try:
                source_date = datetime.fromisoformat(source.get("date", ""))
                if source_date >= cutoff_date:
                    valid_sources.append(source)
            except:
                continue
        
        if len(valid_sources) < 2:
            return False, 0.0
        
        # Calculate confidence based on source agreement and recency
        confidence = min(0.95, 0.6 + (len(valid_sources) * 0.1))
        return True, confidence
    
    async def extract_esa_data(self, pages: List[Dict[str, str]]) -> List[ResearchRecord]:
        """Extract ESA data from crawled pages"""
        records = []
        
        # Define extraction patterns for key ESA fields
        extraction_patterns = {
            "application_deadline": [
                r"deadline[:\s]+([^<\n]+)",
                r"due[:\s]+([^<\n]+)",
                r"submit by[:\s]+([^<\n]+)"
            ],
            "eligibility_income_limit": [
                r"income[:\s]+\$?([0-9,]+)",
                r"household income[:\s]+\$?([0-9,]+)",
                r"family income[:\s]+\$?([0-9,]+)"
            ],
            "award_amount": [
                r"award[:\s]+\$?([0-9,]+)",
                r"voucher[:\s]+\$?([0-9,]+)",
                r"scholarship[:\s]+\$?([0-9,]+)"
            ],
            "portal_url": [
                r"apply at[:\s]+([^\s<]+)",
                r"portal[:\s]+([^\s<]+)",
                r"application[:\s]+([^\s<]+)"
            ]
        }
        
        for field, patterns in extraction_patterns.items():
            field_sources = []
            
            for page in pages:
                content = page["content"]
                
                for pattern in patterns:
                    matches = re.finditer(pattern, content, re.IGNORECASE)
                    for match in matches:
                        value = match.group(1).strip()
                        if value:
                            field_sources.append({
                                "url": page["url"],
                                "date": page["date"],
                                "title": page["title"],
                                "value": value
                            })
            
            # Group by value and validate dual-source requirement
            value_groups = {}
            for source in field_sources:
                value = source["value"]
                if value not in value_groups:
                    value_groups[value] = []
                value_groups[value].append(source)
            
            # Find values with ≥2 sources
            for value, sources in value_groups.items():
                is_valid, confidence = self.validate_dual_source(field, value, sources)
                if is_valid:
                    record = ResearchRecord(
                        field=field,
                        value=value,
                        confidence=confidence,
                        sources=sources[:2]  # Keep top 2 sources
                    )
                    records.append(record)
        
        return records
    
    async def send_webhook(self, record: ResearchRecord):
        """Send research record to webhook with HMAC signature"""
        payload = json.dumps(asdict(record))
        
        # Generate HMAC signature
        signature = hmac.new(
            self.agent_key.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()
        
        headers = {
            "Content-Type": "application/json",
            "X-Agent-Sig": f"sha256={signature}"
        }
        
        try:
            async with self.session.post(self.webhook_url, data=payload, headers=headers) as response:
                if response.status == 200:
                    self.log_json("webhook_sent", {"field": record.field, "status": response.status})
                else:
                    self.log_json("webhook_error", {"field": record.field, "status": response.status})
        except Exception as e:
            self.log_json("webhook_exception", {"field": record.field, "error": str(e)})
    
    async def get_priority_programs(self) -> List[ESAProgram]:
        """Get top 5 priority ESA programs (mock data for now)"""
        # TODO: Replace with actual data source (Airtable API or local cache)
        mock_programs = [
            ESAProgram("FL-001", "Florida ESA", 50000, 3, 10, 5, 0.8, False),
            ESAProgram("TX-002", "Texas ESA", 75000, 2, 8, 8, 0.6, True),
            ESAProgram("AZ-003", "Arizona ESA", 30000, 5, 12, 3, 0.4, False),
            ESAProgram("NC-004", "North Carolina ESA", 40000, 4, 9, 6, 0.7, True),
            ESAProgram("IN-005", "Indiana ESA", 25000, 1, 6, 2, 0.3, False),
        ]
        
        # Calculate priority scores
        max_students = max(p.eligible_student_count for p in mock_programs)
        max_updates = max(p.policy_updates_90d for p in mock_programs)
        
        for program in mock_programs:
            program.priority_score = program.calculate_priority_score(max_students, max_updates)
        
        # Sort by priority score and return top 5
        sorted_programs = sorted(mock_programs, key=lambda p: p.priority_score, reverse=True)
        return sorted_programs[:5]
    
    async def research_cycle(self):
        """Execute nightly research cycle"""
        self.log_json("cycle_start", {"timestamp": datetime.utcnow().isoformat()})
        
        try:
            # Get priority programs
            priority_programs = await self.get_priority_programs()
            self.log_json("priority_programs", {"count": len(priority_programs)})
            
            all_records = []
            
            for program in priority_programs:
                self.log_json("program_research_start", {"program": program.name, "priority": program.priority_score})
                
                # Generate seed URLs for this program (mock for now)
                seed_urls = [
                    f"https://example-state-edu.gov/esa/{program.id.lower()}",
                    f"https://education.state.gov/programs/{program.id.lower()}"
                ]
                
                program_records = []
                
                for seed_url in seed_urls:
                    if self.pages_crawled >= self.max_pages_per_cycle:
                        break
                        
                    # Crawl with hop limits
                    pages = await self.crawl_with_hops(seed_url, self.max_hops_per_seed)
                    
                    # Extract ESA data
                    records = await self.extract_esa_data(pages)
                    program_records.extend(records)
                
                # Send records via webhook
                for record in program_records:
                    await self.send_webhook(record)
                
                all_records.extend(program_records)
                self.log_json("program_research_complete", {
                    "program": program.name,
                    "records_found": len(program_records)
                })
            
            self.log_json("cycle_complete", {
                "total_records": len(all_records),
                "pages_crawled": self.pages_crawled
            })
            
        except Exception as e:
            self.log_json("cycle_error", {"error": str(e)})
            raise

async def main():
    """Main entry point for research agent"""
    async with ResearchAgent() as agent:
        await agent.research_cycle()

if __name__ == "__main__":
    asyncio.run(main())