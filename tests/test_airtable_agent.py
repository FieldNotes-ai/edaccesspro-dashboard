"""
Smoke tests for Airtable AI Agent
"""

import pytest
import asyncio
import json
from unittest.mock import AsyncMock, patch, MagicMock
import sys
import os

# Add agents directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'agents'))

from airtable_agent import AirtableAgent, DataRecord, SchemaField, ChangeRequest, WebhookPayload

@pytest.fixture
def mock_airtable_response():
    """Mock Airtable API response"""
    return {
        "records": [
            {
                "id": "rec123",
                "fields": {
                    "Field Name": "test_field",
                    "Field Type": "singleLineText",
                    "Description": "Test field"
                }
            }
        ]
    }

@pytest.fixture
def airtable_agent():
    """Create Airtable agent instance with mocked environment"""
    with patch.dict(os.environ, {
        'AIRTABLE_BASE_ID': 'test_base_id',
        'AIRTABLE_API_KEY': 'test_api_key',
        'AGENT_KEY': 'test_secret'
    }):
        agent = AirtableAgent()
        return agent

@pytest.mark.asyncio
async def test_rate_limiting(airtable_agent):
    """Test Airtable API rate limiting"""
    import time
    
    start_time = time.time()
    
    # Mock multiple API calls
    with patch.object(airtable_agent, 'session') as mock_session:
        mock_response = AsyncMock()
        mock_response.status = 200
        mock_response.json = AsyncMock(return_value={"records": []})
        mock_session.request.return_value.__aenter__.return_value = mock_response
        
        # Make 3 API calls
        tasks = [
            airtable_agent.airtable_request("GET", "test_table")
            for _ in range(3)
        ]
        await asyncio.gather(*tasks)
    
    elapsed = time.time() - start_time
    
    # Should take at least 4 seconds (2s * 2 intervals) due to rate limiting
    assert elapsed >= 4.0

@pytest.mark.asyncio
async def test_semantic_twin_detection(airtable_agent):
    """Test semantic field matching"""
    # Setup data dictionary
    airtable_agent.data_dictionary = {
        "application_deadline": {
            "type": "date",
            "description": "Application deadline",
            "semantic_tags": ["deadline", "date"]
        },
        "income_limit": {
            "type": "number",
            "description": "Income limit",
            "semantic_tags": ["income", "limit"]
        }
    }
    
    # Test semantic matching
    twin = airtable_agent.find_semantic_twin("due_date", "date")
    assert twin == "application_deadline"
    
    twin = airtable_agent.find_semantic_twin("household_income", "number")
    assert twin == "income_limit"
    
    # Test no match
    twin = airtable_agent.find_semantic_twin("random_field", "text")
    assert twin is None

@pytest.mark.asyncio
async def test_checksum_validation(airtable_agent):
    """Test data checksum validation"""
    test_records = [
        {"field1": "value1", "field2": "value2"},
        {"field1": "value3", "field2": "value4"}
    ]
    
    checksum1 = airtable_agent.calculate_checksum(test_records)
    checksum2 = airtable_agent.calculate_checksum(test_records)
    
    # Same data should produce same checksum
    assert checksum1 == checksum2
    
    # Different data should produce different checksum
    modified_records = test_records.copy()
    modified_records[0]["field1"] = "modified"
    checksum3 = airtable_agent.calculate_checksum(modified_records)
    
    assert checksum1 != checksum3

@pytest.mark.asyncio
async def test_bulk_import_chunking(airtable_agent):
    """Test bulk import with 500-record chunks"""
    # Create 1200 test records
    records = [
        DataRecord(
            table_name="test_table",
            fields={"field1": f"value_{i}"}
        )
        for i in range(1200)
    ]
    
    with patch.object(airtable_agent, 'airtable_request') as mock_request:
        mock_request.return_value = {"records": [{"id": "rec123"}] * 500}
        
        imported, errors = await airtable_agent.bulk_import_data("test_table", records)
        
        # Should make 3 API calls (1200 / 500 = 2.4, rounded up to 3)
        assert mock_request.call_count == 3
        assert imported == 1500  # 3 chunks * 500 records each

@pytest.mark.asyncio
async def test_destructive_change_queuing(airtable_agent):
    """Test destructive change queuing for human review"""
    with patch.object(airtable_agent, 'store_change_request') as mock_store:
        await airtable_agent.queue_destructive_change(
            action="delete_field",
            table_name="test_table",
            field_name="old_field",
            details={"reason": "field no longer needed"}
        )
        
        assert len(airtable_agent.pending_changes) == 1
        change = airtable_agent.pending_changes[0]
        
        assert change.action == "delete_field"
        assert change.table_name == "test_table"
        assert change.field_name == "old_field"
        assert not change.approved
        
        mock_store.assert_called_once()

@pytest.mark.asyncio
async def test_webhook_signature_verification(airtable_agent):
    """Test webhook signature verification"""
    import hmac
    import hashlib
    
    payload = '{"event_type": "test", "data": {}}'
    
    # Generate valid signature
    signature = hmac.new(
        airtable_agent.webhook_secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    
    # Test valid signature
    is_valid = airtable_agent.verify_webhook_signature(payload, f"sha256={signature}")
    assert is_valid is True
    
    # Test invalid signature
    is_valid = airtable_agent.verify_webhook_signature(payload, "sha256=invalid")
    assert is_valid is False

@pytest.mark.asyncio
async def test_nightly_metrics_calculation(airtable_agent):
    """Test nightly metrics computation"""
    # Mock Airtable responses
    mock_table_data = {
        "records": [
            {
                "id": "rec1",
                "fields": {
                    "field1": "value1",
                    "field2": "value2",
                    "field3": ""  # Empty field
                }
            },
            {
                "id": "rec2",
                "fields": {
                    "field1": "value1",  # Duplicate
                    "field2": "value3",
                    "field3": "value4"
                }
            }
        ]
    }
    
    with patch.object(airtable_agent, 'airtable_request') as mock_request:
        mock_request.return_value = mock_table_data
        
        metrics = await airtable_agent.compute_nightly_metrics()
        
        assert "completeness_percent" in metrics
        assert "duplication_percent" in metrics
        assert "tables" in metrics
        assert metrics["completeness_percent"] >= 0
        assert metrics["duplication_percent"] >= 0

@pytest.mark.asyncio
async def test_schema_evolution(airtable_agent):
    """Test schema evolution with new fields"""
    new_fields = [
        {"name": "new_field_1", "type": "singleLineText"},
        {"name": "new_field_2", "type": "number"}
    ]
    
    with patch.object(airtable_agent, 'airtable_request') as mock_request:
        mock_request.return_value = {"id": "fld123", "name": "new_field_1"}
        
        with patch.object(airtable_agent, 'add_to_data_dictionary') as mock_add:
            created_fields = await airtable_agent.evolve_schema("test_table", new_fields)
            
            assert len(created_fields) == 2
            assert mock_request.call_count == 2  # One call per field
            assert mock_add.call_count == 2  # One call per field

@pytest.mark.asyncio
async def test_webhook_payload_handling(airtable_agent):
    """Test webhook payload processing"""
    # Test research update payload
    payload = WebhookPayload(
        event_type="research_update",
        data={
            "table": "ESA Programs",
            "field": "application_deadline",
            "value": "2024-03-15"
        },
        timestamp="2024-01-01T00:00:00Z"
    )
    
    with patch.object(airtable_agent, 'bulk_import_data') as mock_import:
        mock_import.return_value = (1, 0)  # 1 imported, 0 errors
        
        await airtable_agent.handle_research_update(payload)
        
        mock_import.assert_called_once()
        args = mock_import.call_args[0]
        assert args[0] == "ESA Programs"  # table_name
        assert len(args[1]) == 1  # one record
        assert args[1][0].fields["application_deadline"] == "2024-03-15"

def test_data_record_creation():
    """Test DataRecord dataclass"""
    record = DataRecord(
        table_name="test_table",
        fields={"field1": "value1", "field2": 123}
    )
    
    assert record.table_name == "test_table"
    assert record.fields["field1"] == "value1"
    assert record.fields["field2"] == 123
    assert record.record_id is None

def test_change_request_creation():
    """Test ChangeRequest dataclass"""
    change = ChangeRequest(
        id="change_123",
        action="delete_field",
        table_name="test_table",
        field_name="old_field",
        details={"reason": "deprecated"},
        created_at="2024-01-01T00:00:00Z"
    )
    
    assert change.id == "change_123"
    assert change.action == "delete_field"
    assert not change.approved  # Default False

@pytest.mark.asyncio
async def test_gap_report_generation(airtable_agent):
    """Test gap report generation and sending"""
    metrics = {
        "completeness_percent": 75.0,
        "tables": {
            "ESA Programs": {"completeness_percent": 60.0},
            "Applications": {"completeness_percent": 80.0}
        }
    }
    
    with patch.object(airtable_agent, 'session') as mock_session:
        mock_response = AsyncMock()
        mock_response.status = 200
        mock_session.post.return_value.__aenter__.return_value = mock_response
        
        await airtable_agent.send_gap_report(metrics)
        
        # Should send POST request
        mock_session.post.assert_called_once()
        
        # Check the payload contains priority gaps
        call_args = mock_session.post.call_args
        payload = json.loads(call_args[1]['data'])
        
        assert payload["event_type"] == "gap_report"
        assert "priority_gaps" in payload
        assert len(payload["priority_gaps"]) > 0  # ESA Programs has <70% completeness

if __name__ == "__main__":
    pytest.main([__file__, "-v"])