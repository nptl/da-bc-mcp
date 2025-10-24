#!/bin/bash

echo "Testing MCP initialize handshake..."
echo ""

# Test initialize
curl -X POST https://da-bc-mcp-server-beta-289122916571.us-central1.run.app/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"openai-agent","version":"1.0.0"}}}' \
  -s | python3 -m json.tool

echo ""
echo "---"
echo ""
echo "Testing notifications/initialized..."
echo ""

# Test initialized notification
curl -X POST https://da-bc-mcp-server-beta-289122916571.us-central1.run.app/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","method":"notifications/initialized"}' \
  -s | python3 -m json.tool
