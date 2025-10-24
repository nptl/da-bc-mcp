#!/bin/bash

BASE_URL="https://mcp1-beta.damensch.com/mcp"

echo "========================================="
echo "Testing New Order Management Tools"
echo "========================================="
echo ""

# First, get customer details to obtain userId
echo "0️⃣ Getting customer details to obtain userId..."
echo "-------------------------------------------"
CUSTOMER_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{
    "jsonrpc": "2.0",
    "id": 0,
    "method": "tools/call",
    "params": {
      "name": "get_customer_details",
      "arguments": {
        "phone": "9560991656"
      }
    }
  }')

echo "$CUSTOMER_RESPONSE" | python3 -m json.tool | head -30
echo ""

# Extract userId from response
USER_ID=$(echo "$CUSTOMER_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); result=json.loads(data['result']['content'][0]['text']); print(result['customer']['userId'])" 2>/dev/null)

if [ -z "$USER_ID" ]; then
  echo "❌ Failed to get userId"
  exit 1
fi

echo "✅ Got userId: $USER_ID"
echo ""
echo ""

# Test 1: get_customer_orders with basic pagination
echo "1️⃣ Testing get_customer_orders (basic pagination)"
echo "-------------------------------------------"
curl -s -X POST "$BASE_URL" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": 1,
    \"method\": \"tools/call\",
    \"params\": {
      \"name\": \"get_customer_orders\",
      \"arguments\": {
        \"userId\": \"$USER_ID\",
        \"pageNumber\": 1,
        \"pageSize\": 5
      }
    }
  }" | python3 -m json.tool | head -80

echo ""
echo ""

# Test 2: get_customer_orders with filters
echo "2️⃣ Testing get_customer_orders (with status filter)"
echo "-------------------------------------------"
curl -s -X POST "$BASE_URL" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": 2,
    \"method\": \"tools/call\",
    \"params\": {
      \"name\": \"get_customer_orders\",
      \"arguments\": {
        \"userId\": \"$USER_ID\",
        \"pageNumber\": 1,
        \"pageSize\": 3,
        \"orderStatus\": \"Delivered\"
      }
    }
  }" | python3 -m json.tool | head -80

echo ""
echo ""

# Test 3: get_order_details (summary)
echo "3️⃣ Testing get_order_details (summary level)"
echo "-------------------------------------------"
# First get an order ID from the orders list
ORDER_ID=$(curl -s -X POST "$BASE_URL" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": 3,
    \"method\": \"tools/call\",
    \"params\": {
      \"name\": \"get_customer_orders\",
      \"arguments\": {
        \"userId\": \"$USER_ID\",
        \"pageNumber\": 1,
        \"pageSize\": 1
      }
    }
  }" | python3 -c "import sys, json; data=json.load(sys.stdin); result=json.loads(data['result']['content'][0]['text']); print(result['data']['orders'][0]['id'])" 2>/dev/null)

if [ -z "$ORDER_ID" ]; then
  echo "❌ Failed to get orderId for testing"
else
  echo "Using orderId: $ORDER_ID"
  echo ""

  curl -s -X POST "$BASE_URL" \
    -H 'Content-Type: application/json' \
    -H 'Accept: application/json, text/event-stream' \
    -d "{
      \"jsonrpc\": \"2.0\",
      \"id\": 4,
      \"method\": \"tools/call\",
      \"params\": {
        \"name\": \"get_order_details\",
        \"arguments\": {
          \"orderId\": \"$ORDER_ID\",
          \"detailLevel\": \"summary\"
        }
      }
    }" | python3 -m json.tool | head -100
fi

echo ""
echo ""

# Test 4: Verify tools are listed
echo "4️⃣ Verifying tools are listed in tools/list"
echo "-------------------------------------------"
curl -s -X POST "$BASE_URL" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{
    "jsonrpc": "2.0",
    "id": 5,
    "method": "tools/list",
    "params": {}
  }' | python3 -c "import sys, json; data=json.load(sys.stdin); tools=[t['name'] for t in data['result']['tools']]; print('Available tools:', ', '.join(tools)); print('✅ New tools found!' if 'get_customer_orders' in tools and 'get_order_details' in tools else '❌ New tools missing')"

echo ""
echo "========================================="
echo "✅ All new tool tests completed!"
echo "========================================="
