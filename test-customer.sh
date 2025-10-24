#!/bin/bash

echo "Testing get_customer_details for phone 9560991656..."
echo ""

curl -X POST https://da-bc-mcp-server-beta-kh3ftrr6jq-uc.a.run.app/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_customer_details","arguments":{"phone":"9560991656"}}}' \
  -s | python3 -m json.tool
