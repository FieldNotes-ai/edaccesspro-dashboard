#!/usr/bin/env python3
"""
Local Sanity Test Runner for ESA Vendor Dashboard
Runs both agent tests and pytest suite
"""

import subprocess
import sys
import json
from pathlib import Path

def run_command(cmd, description):
    """Run a command and return success status"""
    print(f"\n🔄 {description}")
    print(f"💻 Command: {' '.join(cmd)}")
    print("-" * 50)
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        
        if result.returncode == 0:
            print(f"✅ {description} - SUCCESS")
            if result.stdout:
                print(result.stdout)
            return True
        else:
            print(f"❌ {description} - FAILED")
            if result.stderr:
                print("STDERR:", result.stderr)
            if result.stdout:
                print("STDOUT:", result.stdout)
            return False
            
    except subprocess.TimeoutExpired:
        print(f"⏰ {description} - TIMEOUT")
        return False
    except Exception as e:
        print(f"💥 {description} - ERROR: {e}")
        return False

def create_sample_payload():
    """Create sample payload file for airtable agent test"""
    payload = {
        "event_type": "research_update",
        "data": {
            "table": "ESA Programs",
            "field": "application_deadline",
            "value": "2024-03-15"
        },
        "timestamp": "2024-01-01T00:00:00Z",
        "schema_change": False
    }
    
    with open("sample_payload.json", "w") as f:
        json.dump(payload, f, indent=2)
    
    print("📄 Created sample_payload.json")

def main():
    """Run all sanity tests"""
    print("🧪 ESA Vendor Dashboard - Local Sanity Test Suite")
    print("=" * 60)
    
    # Ensure we're in the right directory
    if not Path("agents").exists():
        print("❌ agents/ directory not found. Run from project root.")
        sys.exit(1)
    
    # Create sample payload
    create_sample_payload()
    
    # Test results
    results = []
    
    # Test 1: Research Agent
    print(f"\n1️⃣  Testing Research Agent")
    success = run_command([
        sys.executable, "test_research_agent.py", 
        "--url", "https://example-esa.gov/program",
        "--pages", "3"
    ], "Research Agent Dry-Run Test")
    results.append(("Research Agent", success))
    
    # Test 2: Airtable Agent
    print(f"\n2️⃣  Testing Airtable Agent")
    success = run_command([
        sys.executable, "test_airtable_agent.py"
    ], "Airtable Agent Dry-Run Test")
    results.append(("Airtable Agent", success))
    
    # Test 3: Pytest Suite
    print(f"\n3️⃣  Running Pytest Suite")
    success = run_command([
        sys.executable, "-m", "pytest", "-q", "--tb=short"
    ], "Pytest Test Suite")
    results.append(("Pytest Suite", success))
    
    # Test 4: KPI Dashboard
    print(f"\n4️⃣  Testing KPI Dashboard")
    success = run_command([
        sys.executable, "kpi_dashboard.py", "--logs-dir", "data/logs"
    ], "KPI Dashboard Test")
    results.append(("KPI Dashboard", success))
    
    # Summary
    print(f"\n📊 Test Results Summary")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if success:
            passed += 1
    
    print("-" * 60)
    print(f"📈 Overall: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    
    # Cleanup
    Path("sample_payload.json").unlink(missing_ok=True)
    
    if passed == total:
        print(f"\n🎉 All tests passed! System is ready for deployment.")
        sys.exit(0)
    else:
        print(f"\n⚠️  Some tests failed. Please review and fix issues.")
        sys.exit(1)

if __name__ == "__main__":
    main()