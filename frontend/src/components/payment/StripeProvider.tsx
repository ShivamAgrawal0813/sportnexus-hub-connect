import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Get publishable key from environment variables
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Check if key is available
if (!stripePublishableKey) {
  console.warn('⚠️ VITE_STRIPE_PUBLISHABLE_KEY is not set in environment variables. Stripe functionality will be disabled.');
}

// Initialize Stripe
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

interface StripeProviderProps {
  children: React.ReactNode;
}

const StripeProvider: React.FC<StripeProviderProps> = ({ children }) => {
  // Create a fallback Elements instance even when Stripe is not configured
  // This prevents the "Could not find Elements context" error
  const fallbackOptions = { 
    clientSecret: 'dummy_secret', 
    appearance: { theme: 'stripe' } 
  };
  
  if (!stripePromise) {
    console.warn('Stripe is not properly configured. Payment features will be disabled.');
    
    // Return a dummy Elements provider to prevent context errors
    return (
      <Elements options={fallbackOptions} stripe={null}>
        {children}
      </Elements>
    );
  }
  
  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
};

export default StripeProvider; 