#!/usr/bin/env bash
# Security Test: Negative HMAC Authentication Test
# Tests that webhook endpoint properly rejects invalid signatures

set -e

# Configuration
WORKER_URL="${CLOUDFLARE_WORKER_URL:-https://esa-webhook-proxy.workers.dev}"
TEST_JSON='{"msg_type":"research_update","payload":{"field":"Fee","value":"$500","confidence":0.85}}'
BAD_SIGNATURE="sha256=INVALID_SIGNATURE_SHOULD_BE_REJECTED"

echo "🔒 Security Test: Webhook Authentication"
echo "========================================"
echo "🎯 Target URL: $WORKER_URL"
echo "📋 Test: Invalid HMAC signature should return HTTP 401"
echo ""

# Make request with invalid signature
echo "📤 Sending request with invalid signature..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST \
    -H "X-Agent-Sig: ${BAD_SIGNATURE}" \
    -H "Content-Type: application/json" \
    -d "${TEST_JSON}" \
    "${WORKER_URL}")

echo "📊 Response HTTP Code: $HTTP_CODE"

# Validate response
if [ "$HTTP_CODE" = "401" ]; then
    echo "✅ PASS: Invalid signature correctly rejected with HTTP 401"
    exit 0
elif [ "$HTTP_CODE" = "000" ]; then
    echo "❌ FAIL: Could not connect to webhook endpoint"
    echo "🔧 Check that CLOUDFLARE_WORKER_URL is set correctly"
    echo "🔧 Ensure the Cloudflare Worker is deployed and accessible"
    exit 2
else
    echo "❌ FAIL: Expected HTTP 401, got HTTP $HTTP_CODE"
    echo "🚨 Security vulnerability: Invalid signatures are being accepted!"
    exit 1
fi