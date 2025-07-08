"""
Smoke tests for Research Agent
"""

import pytest
import asyncio
import json
from unittest.mock import Mock, patch, AsyncMock
import sys
import os

# Add agents directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'agents'))

from research_agent import ResearchAgent, ESAProgram, ResearchRecord

@pytest.fixture
def mock_agent():
    """Create a mock Research Agent for testing"""
    agent = ResearchAgent()
    agent.webhook_url = "https://test.webhook.site/test"
    agent.agent_key = "test-secret-key"
    return agent

@pytest.mark.asyncio
async def test_priority_score_calculation():
    """Test ESA program priority scoring"""
    program = ESAProgram(
        id="TEST-001",
        name="Test ESA Program",
        eligible_student_count=50000,
        vendor_critical_fields_empty=3,
        vendor_critical_fields_total=10,
        policy_updates_90d=5,
        portal_complexity=0.8,
        is_emerging=True
    )
    
    # Test priority score calculation
    max_students = 100000
    max_updates = 10
    
    score = program.calculate_priority_score(max_students, max_updates)
    
    # Verify score is within valid range
    assert 0 <= score <= 1
    
    # Verify emerging bonus is applied
    assert score > 0.15  # Should have emerging bonus
    
    # Test individual components
    market_size = program.eligible_student_count / max_students
    req_gap = program.vendor_critical_fields_empty / program.vendor_critical_fields_total
    change_freq = program.policy_updates_90d / max_updates
    
    assert market_size == 0.5
    assert req_gap == 0.3
    assert change_freq == 0.5

@pytest.mark.asyncio
async def test_dual_source_validation(mock_agent):
    """Test dual-source validation logic"""
    from datetime import datetime, timedelta
    
    # Valid sources (recent)
    valid_sources = [
        {
            "url": "https://example1.com",
            "date": datetime.now().isoformat(),
            "title": "Source 1"
        },
        {
            "url": "https://example2.com", 
            "date": (datetime.now() - timedelta(days=30)).isoformat(),
            "title": "Source 2"
        }
    ]
    
    is_valid, confidence = mock_agent.validate_dual_source("test_field", "test_value", valid_sources)
    
    assert is_valid is True
    assert 0.6 <= confidence <= 0.95
    
    # Invalid sources (too old)
    old_sources = [
        {
            "url": "https://example1.com",
            "date": (datetime.now() - timedelta(days=400)).isoformat(),
            "title": "Old Source"
        }
    ]
    
    is_valid, confidence = mock_agent.validate_dual_source("test_field", "test_value", old_sources)
    
    assert is_valid is False
    assert confidence == 0.0

@pytest.mark.asyncio
async def test_link_extraction(mock_agent):
    """Test relevant link extraction"""
    html_content = """
    <html>
    <body>
        <a href="/esa/application">ESA Application</a>
        <a href="https://education.state.gov/voucher">Voucher Program</a>
        <a href="https://random.com/unrelated">Unrelated Link</a>
        <a href="/scholarship/eligibility">Scholarship Info</a>
    </body>
    </html>
    """
    
    base_url = "https://example.edu"
    links = mock_agent.extract_links(html_content, base_url)
    
    # Should extract relevant education-related links
    assert len(links) >= 2
    assert any("esa" in link.lower() for link in links)
    assert any("scholarship" in link.lower() for link in links)

@pytest.mark.asyncio
async def test_rate_limiting(mock_agent):
    """Test rate limiting functionality"""
    import time
    
    # Mock session
    mock_agent.session = AsyncMock()
    mock_agent.session.get.return_value.__aenter__.return_value.status = 200
    mock_agent.session.get.return_value.__aenter__.return_value.text.return_value = "<html>Test</html>"
    
    start_time = time.time()
    
    # Make multiple requests
    tasks = [mock_agent.fetch_url(f"https://test{i}.com") for i in range(3)]
    await asyncio.gather(*tasks)
    
    elapsed = time.time() - start_time
    
    # Should take at least 4 seconds (2s interval between requests)
    assert elapsed >= 4.0

@pytest.mark.asyncio 
async def test_webhook_signature():
    """Test HMAC signature generation"""
    import hmac
    import hashlib
    
    agent = ResearchAgent()
    agent.agent_key = "test-secret"
    
    # Create test record
    record = ResearchRecord(
        field="test_field",
        value="test_value", 
        confidence=0.85,
        sources=[{"url": "https://test.com", "date": "2024-01-01", "title": "Test"}]
    )
    
    payload = json.dumps(record.__dict__)
    
    # Generate expected signature
    expected_signature = hmac.new(
        agent.agent_key.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    
    # Mock session for webhook test
    agent.session = AsyncMock()
    agent.session.post.return_value.__aenter__.return_value.status = 200
    
    await agent.send_webhook(record)
    
    # Verify webhook was called with correct signature
    call_args = agent.session.post.call_args
    headers = call_args[1]['headers']
    
    assert headers['X-Agent-Sig'] == f"sha256={expected_signature}"

def test_crawl_limits(mock_agent):
    """Test crawl limit enforcement"""
    # Set low limits for testing
    mock_agent.max_pages_per_cycle = 5
    mock_agent.pages_crawled = 5
    
    # Should return None when limit reached
    result = asyncio.run(mock_agent.fetch_url("https://test.com"))
    assert result is None

@pytest.mark.asyncio
async def test_research_record_creation():
    """Test research record creation and validation"""
    record = ResearchRecord(
        field="application_deadline",
        value="2024-12-31",
        confidence=0.92,
        sources=[
            {"url": "https://source1.com", "date": "2024-01-01", "title": "Official Site"},
            {"url": "https://source2.com", "date": "2024-01-02", "title": "News Article"}
        ]
    )
    
    # Verify record structure
    assert record.field == "application_deadline"
    assert record.value == "2024-12-31"
    assert record.confidence == 0.92
    assert len(record.sources) == 2
    
    # Test serialization
    record_dict = record.__dict__
    assert "field" in record_dict
    assert "value" in record_dict
    assert "confidence" in record_dict
    assert "sources" in record_dict

if __name__ == "__main__":
    pytest.main([__file__, "-v"])