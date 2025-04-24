# Environment Setup Guide for SportNexus Hub

This guide explains how to properly set up environment variables for both the frontend and backend of the SportNexus Hub application.

## Backend Environment Setup

1. In the `backend` directory, create a file named `.env` with the following content:

```
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/sportnexus

# Authentication
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=30d

# Stripe Integration
STRIPE_SECRET_KEY=sk_test_your_test_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Email Configuration (if needed)
# EMAIL_HOST=smtp.example.com
# EMAIL_PORT=587
# EMAIL_USER=your_email@example.com
# EMAIL_PASS=your_email_password
```

2. Replace `your_jwt_secret_here` with a strong random string for JWT token generation.
3. Replace `sk_test_your_test_secret_key_here` with your Stripe secret key from the Stripe Dashboard.
4. If you're using Stripe webhooks, replace `whsec_your_webhook_secret_here` with your webhook signing secret.

## Frontend Environment Setup

1. In the `frontend` directory, create a file named `.env.local` with the following content:

```
# API Configuration
VITE_API_URL=http://localhost:5000/api

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Other Configuration
VITE_APP_NAME=SportNexus Hub
```

2. Replace `pk_test_your_publishable_key_here` with your Stripe publishable key (starts with `pk_test_`).

## Important Security Notes

1. **NEVER commit environment files to Git**. They are already added to `.gitignore` to prevent accidental commits.
2. **NEVER hardcode sensitive keys** directly in your code.
3. For deployment environments, set these environment variables on your hosting platform rather than in files.

## Environment Variables Usage

### In Backend (Node.js)
```javascript
// Access environment variables
const stripeKey = process.env.STRIPE_SECRET_KEY;
```

### In Frontend (Vite/React)
```javascript
// Access environment variables
const apiUrl = import.meta.env.VITE_API_URL;
const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
```

## Testing Your Configuration

1. After setting up your environment variables, restart your development servers:
   ```
   # Backend
   cd backend
   npm run dev
   
   # Frontend
   cd frontend
   npm run dev
   ```

2. Check the console logs to confirm environment variables are being loaded correctly.

## Using the Stripe Setup Script

For easier Stripe setup, you can use the included script:

```
cd backend
node scripts/setup-stripe.js
```

This interactive script will guide you through setting up your Stripe keys and test the configuration automatically. 