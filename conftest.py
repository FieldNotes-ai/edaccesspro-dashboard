"""
Pytest configuration for ESA Vendor Dashboard
Shared fixtures and test configuration
"""

import pytest
import asyncio
import os
import sys
from pathlib import Path
from unittest.mock import AsyncMock, patch

# Add agents directory to Python path
agents_dir = Path(__file__).parent / "agents"
sys.path.insert(0, str(agents_dir))

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
def mock_env_vars():
    """Mock environment variables for testing"""
    test_env = {
        'AIRTABLE_BASE_ID': 'test_base_id',
        'AIRTABLE_API_KEY': 'test_api_key', 
        'AGENT_KEY': 'test_secret_key',
        'DRY_RUN': '1',
        'RESEARCH_AGENT_WEBHOOK': 'http://localhost:8080/test'
    }
    
    with patch.dict(os.environ, test_env):
        yield test_env

@pytest.fixture
def mock_aiohttp_session():
    """Mock aiohttp session for testing"""
    session = AsyncMock()
    
    # Mock successful response
    mock_response = AsyncMock()
    mock_response.status = 200
    mock_response.text = AsyncMock(return_value='<html><title>Test</title></html>')
    mock_response.json = AsyncMock(return_value={'records': []})
    
    session.get.return_value.__aenter__.return_value = mock_response
    session.post.return_value.__aenter__.return_value = mock_response
    session.request.return_value.__aenter__.return_value = mock_response
    
    return session

@pytest.fixture
def sample_research_payload():
    """Sample research update payload"""
    return {
        "event_type": "research_update",
        "timestamp": "2024-01-01T00:00:00Z",
        "schema_change": False,
        "data": {
            "table": "ESA Programs",
            "field": "application_deadline",
            "value": "2024-03-15",
            "confidence": 0.85,
            "sources": [
                {
                    "url": "https://test1.com",
                    "date": "2024-01-01",
                    "title": "Test Source 1"
                },
                {
                    "url": "https://test2.com", 
                    "date": "2024-01-01",
                    "title": "Test Source 2"
                }
            ]
        }
    }

@pytest.fixture
def sample_schema_change_payload():
    """Sample schema change payload"""
    return {
        "event_type": "schema_change",
        "timestamp": "2024-01-01T00:00:00Z", 
        "schema_change": True,
        "data": {
            "table": "ESA Programs",
            "fields": [
                {
                    "name": "new_deadline_field",
                    "type": "date",
                    "description": "New deadline field"
                }
            ]
        }
    }

@pytest.fixture
def mock_html_content():
    """Mock HTML content for testing web scraping"""
    return """
    <html>
        <head><title>Florida ESA Program</title></head>
        <body>
            <h1>Education Scholarship Account</h1>
            <p>Application deadline: March 15, 2024</p>
            <p>Income limit: $75,000 per household</p>
            <p>Award amount: $8,500 per student</p>
            <p>Portal: https://florida-esa.gov/apply</p>
            <a href="/eligibility">Eligibility</a>
            <a href="/application">Application</a>
        </body>
    </html>
    """

@pytest.fixture
def temp_log_dir(tmp_path):
    """Create temporary log directory for testing"""
    log_dir = tmp_path / "data" / "logs"
    log_dir.mkdir(parents=True)
    
    # Create sample log files
    research_log = log_dir / "research_agent.log"
    airtable_log = log_dir / "airtable_agent.log"
    
    # Sample log entries
    sample_research_logs = [
        {
            "timestamp": "2024-01-01T00:00:00Z",
            "event_type": "webhook_sent",
            "data": {"field": "application_deadline", "status": 200}
        },
        {
            "timestamp": "2024-01-01T00:05:00Z", 
            "event_type": "field_extracted",
            "data": {"field": "income_limit", "confidence": 0.9}
        }
    ]
    
    sample_airtable_logs = [
        {
            "timestamp": "2024-01-01T00:02:00Z",
            "event_type": "webhook_received", 
            "data": {"event_type": "research_update"}
        },
        {
            "timestamp": "2024-01-01T00:10:00Z",
            "event_type": "nightly_metrics",
            "data": {"completeness_percent": 85.5, "tables": {"ESA Programs": {"completeness_percent": 80.0}}}
        }
    ]
    
    # Write sample logs
    with open(research_log, 'w') as f:
        for log_entry in sample_research_logs:
            f.write(f"{json.dumps(log_entry)}\n")
    
    with open(airtable_log, 'w') as f:
        for log_entry in sample_airtable_logs:
            f.write(f"{json.dumps(log_entry)}\n")
    
    return log_dir

# Pytest configuration
def pytest_configure(config):
    """Configure pytest with custom markers"""
    config.addinivalue_line(
        "markers", "asyncio: mark test as async"
    )
    config.addinivalue_line(
        "markers", "integration: mark test as integration test"
    )
    config.addinivalue_line(
        "markers", "unit: mark test as unit test"
    )

def pytest_collection_modifyitems(config, items):
    """Modify test collection to add markers automatically"""
    for item in items:
        # Add asyncio marker to async tests
        if asyncio.iscoroutinefunction(item.function):
            item.add_marker(pytest.mark.asyncio)
        
        # Add markers based on test file names
        if "test_research_agent" in item.nodeid:
            item.add_marker(pytest.mark.unit)
        elif "test_airtable_agent" in item.nodeid:
            item.add_marker(pytest.mark.unit)
        elif "integration" in item.nodeid:
            item.add_marker(pytest.mark.integration)