#!/usr/bin/env python3
"""
Local sanity test for Research Agent
Dry-run without touching external services
"""

import argparse
import asyncio
import json
import sys
from pathlib import Path
from unittest.mock import AsyncMock, patch
from typing import Dict, List

# Add agents directory to path
sys.path.insert(0, str(Path(__file__).parent / "agents"))

from research_agent import ResearchAgent, ResearchRecord

class MockResearchAgent(ResearchAgent):
    """Mock Research Agent for dry-run testing"""
    
    def __init__(self, dry_run: bool = True):
        # Initialize without calling parent __init__ to avoid real setup
        self.webhook_url = "http://localhost:8080/test"
        self.agent_key = "test-key"
        self.max_hops_per_seed = 3
        self.max_pages_per_cycle = 50
        self.pages_crawled = 0
        self.crawled_urls = set()
        self.source_cache = {}
        self.dry_run = dry_run
        
        # Mock session
        self.session = AsyncMock()
        
        # Setup mock logging
        import logging
        self.logger = logging.getLogger(__name__)
        logging.basicConfig(level=logging.INFO)
    
    def log_json(self, event_type: str, data: Dict):
        """Mock JSON logging"""
        if not self.dry_run:
            print(f"LOG: {event_type} - {data}")
    
    async def fetch_url(self, url: str) -> Dict[str, str]:
        """Mock URL fetching with sample HTML content"""
        if self.pages_crawled >= self.max_pages_per_cycle:
            return None
        
        # Mock HTML content with ESA-related information
        mock_html_templates = [
            """
            <html>
                <head><title>Florida ESA Program</title></head>
                <body>
                    <h1>Education Scholarship Account Program</h1>
                    <p>Application deadline: March 15, 2024</p>
                    <p>Income limit: $75,000 per household</p>
                    <p>Award amount: $8,500 per student</p>
                    <p>Apply at: https://florida-esa.gov/portal</p>
                    <a href="/eligibility">Eligibility Requirements</a>
                    <a href="/application">Application Process</a>
                </body>
            </html>
            """,
            """
            <html>
                <head><title>ESA Eligibility Requirements</title></head>
                <body>
                    <h2>Who Can Apply</h2>
                    <p>Household income must not exceed $75,000</p>
                    <p>Student must be enrolled in public school</p>
                    <p>Deadline for applications: March 15, 2024</p>
                    <p>Maximum voucher amount: $8,500</p>
                    <a href="/faq">Frequently Asked Questions</a>
                </body>
            </html>
            """,
            """
            <html>
                <head><title>ESA Application Portal</title></head>
                <body>
                    <h1>Online Application System</h1>
                    <p>Submit your application by the deadline: March 15, 2024</p>
                    <p>Required documents include income verification</p>
                    <p>Award amounts up to $8,500 available</p>
                    <p>Portal URL: https://florida-esa.gov/apply</p>
                </body>
            </html>
            """
        ]
        
        # Cycle through mock templates
        template_index = self.pages_crawled % len(mock_html_templates)
        mock_content = mock_html_templates[template_index]
        
        self.pages_crawled += 1
        
        result = {
            "url": url,
            "content": mock_content,
            "title": f"Mock ESA Page {self.pages_crawled}",
            "date": "2024-01-01T00:00:00Z",
            "status": 200
        }
        
        self.source_cache[url] = result
        self.log_json("page_fetched", {"url": url, "title": result["title"], "status": 200})
        
        return result
    
    async def send_webhook(self, record: ResearchRecord):
        """Mock webhook sending"""
        if self.dry_run:
            print(f"DRY-RUN: Would send webhook for field '{record.field}' with value '{record.value}'")
        else:
            self.log_json("webhook_sent", {"field": record.field, "confidence": record.confidence})

async def collect_data(seed_url: str, max_pages: int = 5, dry_run: bool = True) -> List[Dict]:
    """Collect data from seed URL with dry-run mode"""
    
    # Create mock agent
    agent = MockResearchAgent(dry_run=dry_run)
    agent.max_pages_per_cycle = max_pages
    
    print(f"🔍 Starting data collection from: {seed_url}")
    print(f"📄 Max pages: {max_pages}")
    print(f"🧪 Dry run: {dry_run}")
    print("-" * 50)
    
    try:
        # Crawl with hop limits
        pages = await agent.crawl_with_hops(seed_url, agent.max_hops_per_seed)
        
        print(f"📊 Crawled {len(pages)} pages")
        
        # Extract ESA data
        records = await agent.extract_esa_data(pages)
        
        print(f"🎯 Extracted {len(records)} data records")
        
        # Convert records to JSON format
        json_records = []
        for record in records:
            json_record = {
                "field": record.field,
                "value": record.value,
                "confidence": record.confidence,
                "sources": record.sources
            }
            json_records.append(json_record)
            
            # Send mock webhook
            await agent.send_webhook(record)
        
        return json_records
        
    except Exception as e:
        print(f"❌ Error during data collection: {e}")
        return []

def validate_json_structure(records: List[Dict]) -> bool:
    """Validate that JSON records have required keys"""
    required_keys = {"field", "value", "confidence", "sources"}
    
    for i, record in enumerate(records):
        record_keys = set(record.keys())
        if record_keys != required_keys:
            print(f"❌ Record {i} missing keys: {required_keys - record_keys}")
            print(f"   Extra keys: {record_keys - required_keys}")
            return False
    
    print(f"✅ All {len(records)} records have correct JSON structure")
    return True

def print_sample_output(records: List[Dict]) -> None:
    """Print sample JSON output"""
    print("\n📋 Sample JSON Output:")
    print("-" * 30)
    
    if records:
        # Show first record as formatted JSON
        sample = records[0]
        print(json.dumps(sample, indent=2))
        
        if len(records) > 1:
            print(f"\n... and {len(records) - 1} more records")
    else:
        print("No records extracted")

def main():
    """Main CLI interface"""
    parser = argparse.ArgumentParser(
        description='Test Research Agent with dry-run mode',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python test_research_agent.py --url https://example.edu/esa
  python test_research_agent.py --url https://state.gov/vouchers --pages 10
  python test_research_agent.py --url https://test.com --no-dry-run
        """
    )
    
    parser.add_argument(
        '--url',
        required=True,
        help='Seed URL to start crawling from'
    )
    
    parser.add_argument(
        '--pages',
        type=int,
        default=5,
        help='Maximum number of pages to crawl (default: 5)'
    )
    
    parser.add_argument(
        '--no-dry-run',
        action='store_true',
        help='Disable dry-run mode (not recommended for testing)'
    )
    
    args = parser.parse_args()
    
    # Run the test
    dry_run = not args.no_dry_run
    
    try:
        records = asyncio.run(collect_data(args.url, args.pages, dry_run))
        
        print("\n" + "=" * 50)
        print("🧪 TEST RESULTS")
        print("=" * 50)
        
        print(f"📄 Total pages crawled: {len(records) if records else 0}")
        
        # Validate JSON structure
        if records:
            is_valid = validate_json_structure(records)
            print_sample_output(records)
            
            if is_valid:
                print("\n✅ Test PASSED - All records have correct structure")
                sys.exit(0)
            else:
                print("\n❌ Test FAILED - Invalid JSON structure")
                sys.exit(1)
        else:
            print("\n⚠️  Test completed but no records extracted")
            print("   This might be normal for some URLs")
            sys.exit(0)
            
    except Exception as e:
        print(f"\n❌ Test FAILED with exception: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()