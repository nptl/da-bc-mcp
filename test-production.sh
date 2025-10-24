#!/bin/bash

PROD_URL="https://da-bc-mcp-server-prod-kh3ftrr6jq-uc.a.run.app"

echo "========================================="
echo "Testing PRODUCTION MCP Server"
echo "========================================="
echo ""

echo "1. Health Check:"
curl -s "$PROD_URL/health" | python3 -m json.tool
echo ""

echo "2. Tools List:"
curl -s -X POST "$PROD_URL/mcp" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | python3 -m json.tool | head -40
echo ""

echo "3. Test Tool Call (get_customer_details):"
curl -s -X POST "$PROD_URL/mcp" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_customer_details","arguments":{"phone":"9560991656"}}}' | python3 -c "import sys, json; data=json.load(sys.stdin); print('✅ Tool call successful!' if 'result' in data else '❌ Tool call failed')"

echo ""
echo "========================================="
echo "✅ Production server is live!"
echo "========================================="
