#!/usr/bin/env python3
"""
Rate Limit Simulation Test
Burst 40 requests to test rate limiting - expect first 30 = 200, rest = 429
"""

import asyncio
import aiohttp
import json
import os
import hmac
import hashlib
import time
from collections import Counter

# Configuration
WORKER_URL = os.getenv("CLOUDFLARE_WORKER_URL", "https://esa-webhook-proxy.workers.dev")
AGENT_KEY = os.getenv("AGENT_KEY", "test-key-for-rate-limit-testing")
TOTAL_REQUESTS = 40
EXPECTED_SUCCESS_LIMIT = 30

async def fire_request(session: aiohttp.ClientSession, request_id: int) -> tuple:
    """Fire a single authenticated request"""
    
    # Create test payload
    payload = {
        "msg_type": "research_update",
        "payload": {
            "field": f"test_field_{request_id}",
            "value": f"test_value_{request_id}",
            "confidence": 0.85,
            "idx": request_id
        },
        "timestamp": time.time()
    }
    
    # Generate HMAC signature
    body = json.dumps(payload).encode('utf-8')
    signature = hmac.new(
        AGENT_KEY.encode('utf-8'),
        body,
        hashlib.sha256
    ).hexdigest()
    
    # Prepare headers
    headers = {
        "X-Agent-Sig": f"sha256={signature}",
        "Content-Type": "application/json",
        "User-Agent": f"ESA-Rate-Limit-Test/{request_id}"
    }
    
    try:
        start_time = time.time()
        async with session.post(WORKER_URL, data=body, headers=headers) as response:
            end_time = time.time()
            
            return (
                request_id,
                response.status,
                end_time - start_time,
                len(body)
            )
    except Exception as e:
        return (request_id, 0, 0, 0)  # Connection error

async def run_rate_limit_test():
    """Run the rate limit simulation"""
    
    print("⚡ Rate Limit Simulation Test")
    print("=" * 50)
    print(f"🎯 Target URL: {WORKER_URL}")
    print(f"📊 Total requests: {TOTAL_REQUESTS}")
    print(f"🔑 Agent key length: {len(AGENT_KEY)}")
    print(f"✅ Expected success limit: {EXPECTED_SUCCESS_LIMIT}")
    print("")
    
    # Configure session with timeout
    timeout = aiohttp.ClientTimeout(total=30, connect=10)
    connector = aiohttp.TCPConnector(limit=50, limit_per_host=50)
    
    async with aiohttp.ClientSession(
        timeout=timeout,
        connector=connector
    ) as session:
        
        print("🚀 Firing burst of requests...")
        start_time = time.time()
        
        # Fire all requests concurrently
        tasks = [fire_request(session, i) for i in range(TOTAL_REQUESTS)]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        end_time = time.time()
        total_duration = end_time - start_time
        
        print(f"⏱️  Total test duration: {total_duration:.2f} seconds")
        print("")
        
        # Process results
        status_counts = Counter()
        successful_requests = []
        failed_requests = []
        
        print("📋 Request Results:")
        print("ID  | Status | Duration | Size")
        print("----|--------|----------|-----")
        
        for result in results:
            if isinstance(result, Exception):
                print(f"ERR | Exception: {result}")
                failed_requests.append(result)
                continue
            
            req_id, status, duration, size = result
            status_counts[status] += 1
            
            print(f"{req_id:3d} | {status:6d} | {duration:8.3f} | {size:4d}")
            
            if status == 200:
                successful_requests.append(req_id)
            elif status in [429, 503]:  # Rate limited
                failed_requests.append(req_id)
        
        print("")
        print("📊 Summary Statistics:")
        print(f"   • Total requests sent: {TOTAL_REQUESTS}")
        print(f"   • HTTP 200 (Success): {status_counts[200]}")
        print(f"   • HTTP 429 (Rate Limited): {status_counts[429]}")
        print(f"   • HTTP 401 (Unauthorized): {status_counts[401]}")
        print(f"   • HTTP 500+ (Server Error): {sum(status_counts[s] for s in status_counts if s >= 500)}")
        print(f"   • Connection Errors: {status_counts[0]}")
        print(f"   • Average RPS: {TOTAL_REQUESTS/total_duration:.1f}")
        
        # Validate rate limiting behavior
        success_count = status_counts[200]
        rate_limited_count = status_counts[429] + status_counts[503]
        
        print("")
        print("🔍 Rate Limiting Analysis:")
        
        if success_count <= EXPECTED_SUCCESS_LIMIT:
            print(f"✅ PASS: Success count ({success_count}) within expected limit ({EXPECTED_SUCCESS_LIMIT})")
        else:
            print(f"❌ FAIL: Too many successful requests ({success_count} > {EXPECTED_SUCCESS_LIMIT})")
            print("🚨 Rate limiting may not be working correctly!")
            return False
        
        if rate_limited_count > 0:
            print(f"✅ PASS: Rate limiting active ({rate_limited_count} requests limited)")
        else:
            print("⚠️  WARNING: No rate-limited responses detected")
        
        # Check for authentication errors
        if status_counts[401] > 0:
            print(f"⚠️  WARNING: {status_counts[401]} authentication failures detected")
            print("🔧 Check AGENT_KEY configuration")
        
        # Check for server errors
        server_errors = sum(status_counts[s] for s in status_counts if s >= 500)
        if server_errors > 0:
            print(f"⚠️  WARNING: {server_errors} server errors detected")
        
        # Overall test result
        print("")
        if success_count <= EXPECTED_SUCCESS_LIMIT and rate_limited_count > 0:
            print("🎉 OVERALL: Rate limiting test PASSED")
            return True
        else:
            print("❌ OVERALL: Rate limiting test FAILED")
            return False

def main():
    """Main entry point"""
    try:
        # Validate environment
        if not WORKER_URL.startswith('http'):
            print("❌ Invalid CLOUDFLARE_WORKER_URL - must start with http/https")
            return False
        
        if len(AGENT_KEY) < 8:
            print("⚠️  WARNING: AGENT_KEY is very short - may cause authentication issues")
        
        # Run the test
        result = asyncio.run(run_rate_limit_test())
        
        if result:
            print("\n✅ Rate limit simulation completed successfully")
            return True
        else:
            print("\n❌ Rate limit simulation failed")
            return False
            
    except KeyboardInterrupt:
        print("\n⏹️  Test interrupted by user")
        return False
    except Exception as e:
        print(f"\n💥 Test failed with exception: {e}")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)