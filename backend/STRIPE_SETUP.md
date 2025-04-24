# Stripe Setup Guide for SportNexus Hub

This guide will help you set up Stripe for payment processing in your SportNexus Hub application.

## Step 1: Create a Stripe Account

1. Go to [Stripe](https://stripe.com) and sign up for an account
2. Verify your email and complete the registration process
3. Navigate to the Stripe Dashboard

## Step 2: Get Your API Keys

1. In the Stripe Dashboard, go to Developers → API keys
2. You'll find two types of keys:
   - **Publishable key**: Used in your frontend code
   - **Secret key**: Used in your backend code
3. For development, use the keys in the "Test Data" section

## Step 3: Configure Backend Environment Variables

1. Create or update the `.env` file in your backend directory
2. Add your Stripe secret key:
   ```
   STRIPE_SECRET_KEY=sk_test_your_test_secret_key
   ```
3. Restart your backend server for changes to take effect

## Step 4: Set Up Stripe Webhook (Optional but Recommended)

1. In Stripe Dashboard, go to Developers → Webhooks
2. Click "Add endpoint"
3. For local development, use a tool like [Stripe CLI](https://stripe.com/docs/stripe-cli) or [ngrok](https://ngrok.com/) to create a tunnel to your local server
4. Set the endpoint URL to `https://your-domain.com/api/payments/webhook` or your local equivalent
5. Select events to listen for (at minimum, select `payment_intent.succeeded` and `payment_intent.payment_failed`)
6. After creating the webhook, you'll get a signing secret
7. Add this to your backend `.env` file:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   ```

## Step 5: Configure Frontend (React)

1. Install the required packages:
   ```
   npm install @stripe/react-stripe-js @stripe/stripe-js
   ```
2. The frontend code should already be set up to use the Stripe Elements components

## Step 6: Testing Payments

1. Use the following test card numbers for testing:
   - **Successful payment**: 4242 4242 4242 4242
   - **Failed payment**: 4000 0000 0000 0002
2. Use any future expiration date, any 3-digit CVC, and any postal code

## Troubleshooting

- **"Stripe is not configured properly"**: Make sure your `STRIPE_SECRET_KEY` is correctly set in your `.env` file
- **Payment fails**: Check the Stripe Dashboard's "Events" tab for detailed error information
- **Webhook errors**: Verify your webhook URL is accessible and the signing secret is correctly configured
- **Invalid API Key error**: Make sure you're using the correct key format and it hasn't been revoked

For more information, refer to the [Stripe API Documentation](https://stripe.com/docs/api). 