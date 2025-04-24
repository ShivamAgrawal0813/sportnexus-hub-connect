/**
 * This is a debugging utility to test API endpoints
 * Run with: npx ts-node src/utils/testApi.ts
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

const testApi = async () => {
  try {
    // Test GET endpoint
    console.log('Testing GET /api/test endpoint...');
    const getResponse = await fetch(`${BASE_URL}/api/test`);
    const getData = await getResponse.json();
    console.log('GET Response:', getData);

    // Test POST endpoint
    console.log('\nTesting POST /api/test-post endpoint...');
    const postResponse = await fetch(`${BASE_URL}/api/test-post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Test User', email: 'test@example.com' }),
    });
    const postData = await postResponse.json();
    console.log('POST Response:', postData);

    // Test register endpoint
    console.log('\nTesting POST /api/auth/register endpoint...');
    const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      }),
    });
    const registerStatus = registerResponse.status;
    console.log('Register Status:', registerStatus);
    
    try {
      const registerData = await registerResponse.json();
      console.log('Register Response:', registerData);
    } catch (error) {
      console.error('Error parsing register response:', error);
    }

  } catch (error) {
    console.error('API Test error:', error);
  }
};

// Run the tests
testApi(); 