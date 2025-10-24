#!/usr/bin/env node

/**
 * Test script for MCP SSE server
 * This script manually connects to the MCP server via SSE and tests tool execution
 */

import { EventSource } from 'eventsource';
import fetch from 'node-fetch';

const SERVER_URL = 'https://da-bc-mcp-server-beta-kh3ftrr6jq-uc.a.run.app';
let sessionId = null;
let messageEndpoint = null;

console.log('🧪 Testing MCP Server via SSE...\n');

// Step 1: Connect to SSE endpoint
console.log('1️⃣ Connecting to SSE endpoint...');
const eventSource = new EventSource(`${SERVER_URL}/sse`);

eventSource.onopen = () => {
  console.log('✅ SSE connection established\n');
};

eventSource.onerror = (error) => {
  console.error('❌ SSE connection error:', error);
  process.exit(1);
};

eventSource.onmessage = (event) => {
  console.log('📨 Received SSE message:', event.data);

  try {
    const data = JSON.parse(event.data);
    console.log('📦 Parsed data:', JSON.stringify(data, null, 2));

    // Check if this is an endpoint event
    if (data.type === 'endpoint' && data.endpoint) {
      messageEndpoint = data.endpoint;
      sessionId = new URL(messageEndpoint, SERVER_URL).searchParams.get('sessionId');
      console.log(`\n2️⃣ Got session ID: ${sessionId}`);
      console.log(`   Message endpoint: ${messageEndpoint}\n`);

      // Now test tool listing
      testToolList();
    }

    // Handle JSON-RPC responses
    if (data.jsonrpc === '2.0') {
      console.log('\n📋 JSON-RPC Response received:');
      console.log(JSON.stringify(data, null, 2));

      if (data.result && data.result.tools) {
        console.log('\n✅ Tool list retrieved successfully!');
        console.log('Available tools:', data.result.tools.map(t => t.name).join(', '));

        // Test calling get_customer_details
        testGetCustomerDetails();
      }
    }
  } catch (e) {
    console.log('   (Not JSON, raw message)');
  }
};

// Function to send JSON-RPC request
async function sendRequest(method, params = {}) {
  if (!sessionId || !messageEndpoint) {
    console.error('❌ No session ID or message endpoint available');
    return;
  }

  const request = {
    jsonrpc: '2.0',
    id: Date.now(),
    method: method,
    params: params
  };

  console.log(`\n📤 Sending ${method} request...`);
  console.log('Request:', JSON.stringify(request, null, 2));

  try {
    const response = await fetch(`${SERVER_URL}${messageEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });

    console.log(`Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const text = await response.text();
      console.error('❌ Request failed:', text);
    }
  } catch (error) {
    console.error('❌ Request error:', error.message);
  }
}

// Test: List available tools
async function testToolList() {
  console.log('\n3️⃣ Testing tool list retrieval...');
  await sendRequest('tools/list');
}

// Test: Get customer details
async function testGetCustomerDetails() {
  console.log('\n4️⃣ Testing get_customer_details for phone 9560991656...');
  await sendRequest('tools/call', {
    name: 'get_customer_details',
    arguments: {
      phone: '9560991656'
    }
  });

  // Wait a bit for response, then exit
  setTimeout(() => {
    console.log('\n✅ Test completed!');
    eventSource.close();
    process.exit(0);
  }, 5000);
}

// Handle timeout
setTimeout(() => {
  console.log('\n⏱️  Test timeout - no response received');
  eventSource.close();
  process.exit(1);
}, 30000);
