import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';

// SECURITY NOTICE: No API keys should ever be hardcoded in this file.
// All sensitive credentials must be stored in environment variables only.

// Log the current directory and environment
console.log('Current directory:', process.cwd());
console.log('Env file path:', path.resolve(process.cwd(), '.env'));

// Ensure environment variables are loaded
dotenv.config();

// Check if Stripe secret key is available
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('⚠️ STRIPE_SECRET_KEY is not set in environment variables. Stripe functionality will be disabled.');
} else {
  console.log('✅ STRIPE_SECRET_KEY is properly configured');
  // Only log the first 4 and last 4 characters for security
  const key = process.env.STRIPE_SECRET_KEY;
  const maskedKey = `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  console.log('Key signature:', maskedKey);
}

/**
 * Creates a Stripe instance if the secret key is available
 * This lazy initialization pattern ensures we only create the instance when needed
 * and when the environment variables are properly loaded
 */
const createStripeInstance = (): Stripe | null => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null;
  }
  
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-03-31.basil',
  });
};

// Export a function to get the Stripe instance
let stripeInstance: Stripe | null = null;

const getStripeInstance = (): Stripe | null => {
  if (!stripeInstance) {
    stripeInstance = createStripeInstance();
    
    if (stripeInstance) {
      console.log('Stripe instance successfully created');
    }
  }
  return stripeInstance;
};

export default getStripeInstance; 