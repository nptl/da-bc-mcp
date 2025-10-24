#!/bin/bash

BASE_URL="https://mcp1-beta.damensch.com/mcp"

echo "========================================="
echo "Testing MCP Tools on Custom Domain"
echo "========================================="
echo ""

# Test 1: get_auth_token
echo "1️⃣ Testing get_auth_token"
echo "-------------------------------------------"
curl -s -X POST "$BASE_URL" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "get_auth_token",
      "arguments": {}
    }
  }' | python3 -m json.tool

echo ""
echo ""

# Test 2: get_customer_details by phone
echo "2️⃣ Testing get_customer_details (by phone)"
echo "-------------------------------------------"
curl -s -X POST "$BASE_URL" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "get_customer_details",
      "arguments": {
        "phone": "9560991656"
      }
    }
  }' | python3 -m json.tool

echo ""
echo ""

# Test 3: get_customer_details by email
echo "3️⃣ Testing get_customer_details (by email)"
echo "-------------------------------------------"
curl -s -X POST "$BASE_URL" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "get_customer_details",
      "arguments": {
        "email": "test@example.com"
      }
    }
  }' | python3 -m json.tool

echo ""
echo "========================================="
echo "✅ All tool tests completed!"
echo "========================================="
