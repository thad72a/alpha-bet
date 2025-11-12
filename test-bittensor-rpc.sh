#!/bin/bash

echo "🧪 Testing Bittensor Testnet RPC..."
echo ""

echo "Testing: https://test.chain.opentensor.ai"
echo ""

# Test with 5 second timeout
start_ms=$(date +%s%3N)
response=$(curl -X POST https://test.chain.opentensor.ai \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  --max-time 5 \
  --silent \
  --write-out "\n%{http_code}" 2>&1)
end_ms=$(date +%s%3N)

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)
duration_ms=$((end_ms - start_ms))
duration=$(awk "BEGIN {printf \"%.3f\", $duration_ms/1000}")

echo "Response time: ${duration}s"
echo "HTTP Code: $http_code"
echo "Response: $body"
echo ""

if [ "$http_code" = "200" ] && echo "$body" | grep -q "result"; then
    if (( duration_ms < 2000 )); then
        echo "✅ RPC is FAST and working! Good to deploy."
        exit 0
    else
        echo "⚠️  RPC is SLOW (${duration}s). Deployment might fail."
        echo "   Recommendation: Wait and try later."
        exit 1
    fi
else
    echo "❌ RPC is NOT responding correctly."
    echo "   Recommendation: Use localhost for development."
    exit 1
fi
