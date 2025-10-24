#!/bin/bash

# Test production with custom domain (if working) or direct URL
PROD_URL="https://mcp1.damensch.com/mcp"
PROD_FALLBACK_URL="https://da-bc-mcp-server-prod-kh3ftrr6jq-uc.a.run.app/mcp"

echo "========================================="
echo "Testing New Order Management Tools - PRODUCTION"
echo "========================================="
echo ""

# Test which URL works
echo "🔍 Testing connectivity..."
if curl -s -f https://mcp1.damensch.com/health > /dev/null 2>&1; then
  BASE_URL="$PROD_URL"
  echo "✅ Using custom domain: mcp1.damensch.com"
else
  BASE_URL="$PROD_FALLBACK_URL"
  echo "⚠️  Custom domain not ready, using direct URL"
fi
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

# Test 1: Verify tools are listed
echo "1️⃣ Verifying new tools are listed"
echo "-------------------------------------------"
TOOLS_LIST=$(curl -s -X POST "$BASE_URL" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }')

echo "$TOOLS_LIST" | python3 -c "import sys, json; data=json.load(sys.stdin); tools=[t['name'] for t in data['result']['tools']]; print('Available tools:', ', '.join(tools)); print('✅ New tools found!' if 'get_customer_orders' in tools and 'get_order_details' in tools else '❌ New tools missing')"
echo ""
echo ""

# Test 2: get_customer_orders with basic pagination
echo "2️⃣ Testing get_customer_orders (basic pagination)"
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
        \"pageSize\": 5
      }
    }
  }" | python3 -m json.tool | head -100

echo ""
echo ""

# Test 3: get_customer_orders with filters
echo "3️⃣ Testing get_customer_orders (with status filter)"
echo "-------------------------------------------"
curl -s -X POST "$BASE_URL" \
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
        \"pageSize\": 3,
        \"orderStatus\": \"Delivered\"
      }
    }
  }" | python3 -m json.tool | head -100

echo ""
echo ""

# Test 4: get_order_details (summary)
echo "4️⃣ Testing get_order_details (summary level)"
echo "-------------------------------------------"
# First get an order ID from the orders list
ORDER_ID=$(curl -s -X POST "$BASE_URL" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": 4,
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
      \"id\": 5,
      \"method\": \"tools/call\",
      \"params\": {
        \"name\": \"get_order_details\",
        \"arguments\": {
          \"orderId\": \"$ORDER_ID\",
          \"detailLevel\": \"summary\"
        }
      }
    }" | python3 -m json.tool | head -150
fi

echo ""
echo ""
echo "========================================="
echo "✅ Production testing completed!"
echo "========================================="
echo ""
echo "Production URLs:"
echo "  Custom Domain: https://mcp1.damensch.com/mcp"
echo "  Direct URL: https://da-bc-mcp-server-prod-kh3ftrr6jq-uc.a.run.app/mcp"
