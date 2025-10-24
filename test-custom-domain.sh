#!/bin/bash

echo "Testing custom domain: mcp1-beta.damensch.com"
echo ""

echo "1. Health check:"
curl -s https://mcp1-beta.damensch.com/health | python3 -m json.tool
echo ""

echo "2. Tools list:"
curl -s -X POST https://mcp1-beta.damensch.com/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | python3 -m json.tool
