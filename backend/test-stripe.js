const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

console.log('Current directory:', process.cwd());
const envPath = path.resolve(process.cwd(), '.env');
console.log('Env file path:', envPath);
console.log('File exists:', fs.existsSync(envPath));

// Load environment variables
dotenv.config();

// Check environment variables
console.log('Environment variables:');
console.log('STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);

if (process.env.STRIPE_SECRET_KEY) {
  // Only log the first 4 and last 4 characters for security
  const key = process.env.STRIPE_SECRET_KEY;
  const maskedKey = `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  console.log('Key signature:', maskedKey);
  
  // Initialize Stripe for testing
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    console.log('Stripe instance created successfully');
    
    // Try to make a simple API call
    stripe.customers.list({ limit: 1 })
      .then(customers => {
        console.log('Successfully connected to Stripe API');
      })
      .catch(error => {
        console.error('Error connecting to Stripe API:', error.message);
      });
  } catch (error) {
    console.error('Error initializing Stripe:', error.message);
  }
} else {
  console.error('STRIPE_SECRET_KEY is not set in environment variables');
} 