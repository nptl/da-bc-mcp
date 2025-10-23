#!/usr/bin/env tsx

/**
 * Test script for API functions
 * Tests both auth token and customer details endpoints
 */

import { apiClient } from './src/clients/api-client.js';

async function testApis() {
  console.log('========================================');
  console.log('Testing BetterCommerce APIs');
  console.log('========================================\n');

  try {
    // Test 1: Get Auth Token
    console.log('TEST 1: Getting authentication token...');
    console.log('----------------------------------------');
    const token = await apiClient.getAuthToken();
    console.log('✅ Token received successfully!');
    console.log('Token (first 50 chars):', token.substring(0, 50) + '...');
    console.log('Token length:', token.length, 'characters\n');

    // Test 2: Get Customer Details by Phone
    console.log('TEST 2: Getting customer details by phone...');
    console.log('----------------------------------------');
    const customer = await apiClient.getCustomerDetails({
      phone: '9560991656', // Your test phone number
    });

    if (customer) {
      console.log('✅ Customer found!');
      console.log('Customer ID:', customer.userId);
      console.log('Name:', customer.firstName, customer.lastName);
      console.log('Email:', customer.email);
      console.log('Mobile:', customer.mobile);
      console.log('Registered:', customer.isRegistered);
      console.log('\nFull customer data:');
      console.log(JSON.stringify(customer, null, 2));
    } else {
      console.log('❌ No customer found with that phone number');
    }

    console.log('\n========================================');
    console.log('✅ All tests completed successfully!');
    console.log('========================================');

  } catch (error: any) {
    console.error('\n========================================');
    console.error('❌ Test failed with error:');
    console.error('========================================');
    console.error(error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

testApis();
