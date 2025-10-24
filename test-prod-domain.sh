#!/bin/bash

echo "Testing Production Custom Domain: mcp1.damensch.com"
echo "=================================================="
echo ""

echo "1. Health Check:"
echo "----------------"
curl -s https://mcp1.damensch.com/health | python3 -m json.tool
echo ""

echo "2. Tools List:"
echo "----------------"
curl -s -X POST https://mcp1.damensch.com/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | python3 -m json.tool | head -40
echo ""

echo "3. Test Tool Call (get_customer_details):"
echo "------------------------------------------"
curl -s -X POST https://mcp1.damensch.com/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_customer_details","arguments":{"phone":"9560991656"}}}' | python3 -c "import sys, json; data=json.load(sys.stdin); print('✅ PRODUCTION WORKING!' if 'result' in data else '❌ Failed: ' + str(data))"

echo ""
echo "=================================================="
