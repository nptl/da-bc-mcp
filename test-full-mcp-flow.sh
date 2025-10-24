#!/bin/bash

# Complete MCP protocol flow test - simulating what OpenAI Agent Builder does
SERVER_URL="https://da-bc-mcp-server-beta-289122916571.us-central1.run.app"

echo "========================================="
echo "Testing Complete MCP Protocol Flow"
echo "========================================="
echo ""

# Step 1: Initialize handshake
echo "Step 1: Testing 'initialize' handshake"
echo "---------------------------------------"
INIT_RESPONSE=$(curl -s -X POST "${SERVER_URL}/mcp" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {
        "roots": {
          "listChanged": true
        }
      },
      "clientInfo": {
        "name": "OpenAI-Agent-Builder",
        "version": "1.0.0"
      }
    }
  }')

echo "$INIT_RESPONSE" | python3 -m json.tool
echo ""

# Check if initialize succeeded
if echo "$INIT_RESPONSE" | grep -q '"result"'; then
    echo "✅ Initialize successful"
else
    echo "❌ Initialize failed"
    exit 1
fi

echo ""
echo "Step 2: Sending 'initialized' notification"
echo "-------------------------------------------"
NOTIF_RESPONSE=$(curl -s -X POST "${SERVER_URL}/mcp" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{
    "jsonrpc": "2.0",
    "method": "notifications/initialized"
  }')

if [ -z "$NOTIF_RESPONSE" ] || echo "$NOTIF_RESPONSE" | grep -q '{}'; then
    echo "✅ Initialized notification acknowledged"
else
    echo "Response: $NOTIF_RESPONSE"
fi

echo ""
echo "Step 3: Requesting tools list"
echo "------------------------------"
TOOLS_RESPONSE=$(curl -s -X POST "${SERVER_URL}/mcp" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list",
    "params": {}
  }')

echo "$TOOLS_RESPONSE" | python3 -m json.tool
echo ""

# Check if tools/list succeeded
if echo "$TOOLS_RESPONSE" | grep -q '"tools"'; then
    echo "✅ Tools list retrieved successfully"
    TOOL_COUNT=$(echo "$TOOLS_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data['result']['tools']))")
    echo "   Found $TOOL_COUNT tools"
else
    echo "❌ Tools list retrieval failed"
    exit 1
fi

echo ""
echo "Step 4: Calling a tool (get_customer_details)"
echo "----------------------------------------------"
CALL_RESPONSE=$(curl -s -X POST "${SERVER_URL}/mcp" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "get_customer_details",
      "arguments": {
        "phone": "9560991656"
      }
    }
  }')

echo "$CALL_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(json.dumps(data, indent=2))" 2>/dev/null || echo "$CALL_RESPONSE"
echo ""

# Check if tool call succeeded
if echo "$CALL_RESPONSE" | grep -q '"success": true'; then
    echo "✅ Tool call successful"
else
    echo "⚠️  Tool call may have failed or returned error"
fi

echo ""
echo "========================================="
echo "✅ All MCP protocol steps completed!"
echo "========================================="
