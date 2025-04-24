# SportNexus Hub

A comprehensive platform for sports equipment rental, venue booking, and tutorial services.

## Overview

SportNexus Hub connects sports enthusiasts with the equipment, venues, and knowledge they need. The platform enables users to rent sports equipment, book venues for their activities, and enroll in tutorials to improve their skills - all in one place.

## Tech Stack

- **Frontend**: React + TypeScript (using Vite), Tailwind CSS, shadcn/ui
- **Backend**: Node.js + Express.js + TypeScript
- **Database**: MongoDB Atlas (using mongoose)
- **Auth**: JWT-based email/password authentication
- **State Management**: TanStack Query for data fetching
- **Styling**: Tailwind + dark/light mode support
- **Payment Processing**: Stripe API integration
- **Digital Wallet**: Custom implementation with MongoDB
- **Form Validation**: React Hook Form with Zod
- **Data Fetching**: Axios with request interceptors

## Implemented Features

### For Users
- **Authentication System**: Register, login, and profile management
- **Equipment Rental**: Browse and rent sports equipment with detailed listings
- **Venue Booking**: Find and book sports venues with time slot selection
- **Tutorial Enrollment**: Join tutorials led by experienced instructors
- **Booking Management**: Track all bookings in one convenient dashboard
- **Review System**: Rate and review equipment, venues, and tutorials
- **User Profiles**: Manage personal information and booking history
- **Payment System**: Process payments using Stripe or digital wallet
- **Digital Wallet**: Add funds and manage wallet balance for in-platform transactions

### For Admins
- **Item Management**: Create and manage equipment, venues, and tutorials
- **Booking Administration**: Confirm, reject, or mark bookings as completed
- **Admin Dashboard**: View equipment, venues, and tutorials created by the admin
- **My Bookings**: Track and manage bookings for admin-created items
- **Payment Oversight**: Monitor payment transactions and process refunds
- **Discount Management**: Create and manage promotional codes
- **Settings**: Admin tools for data migration and system maintenance

## Project Structure

```
sportnexus-hub-connect/
├── backend/             # Express backend
│   ├── src/             # Source code
│   │   ├── config/      # Configuration files
│   │   ├── controllers/ # Route controllers
│   │   ├── middleware/  # Custom middleware
│   │   ├── models/      # Mongoose models
│   │   ├── routes/      # API routes
│   │   ├── utils/       # Utility functions
│   │   └── index.ts     # Main server file
│   ├── .env             # Environment variables
│   ├── package.json     # Dependencies
│   └── tsconfig.json    # TypeScript configuration
│
├── frontend/            # React frontend
│   ├── src/             # Frontend source code
│   │   ├── components/  # React components
│   │   ├── context/     # React context providers
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utility functions
│   │   ├── pages/       # Route components
│   │   └── types/       # TypeScript type definitions
│   ├── .env             # Frontend environment variables
│   ├── package.json     # Dependencies
│   └── index.html       # HTML entry point
│
└── README.md            # Project documentation
```

## Core Models

- **User**: Handles authentication and user profiles
- **Equipment**: Stores sports equipment details and availability
- **Venue**: Manages sports facilities with time slots
- **Tutorial**: Contains educational content and enrollment info
- **Booking**: Tracks all bookings across different item types
- **Review**: Allows users to rate and review items
- **Payment**: Handles payment processing and transaction records
- **Wallet**: Manages user wallet balances and transactions
- **Discount**: Stores promotional codes and discount rules

## Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn
- Stripe account (for payment processing)

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/sportnexus-hub-connect.git
   cd sportnexus-hub-connect
   ```

2. Install dependencies for both frontend and backend:
   ```
   # Install frontend dependencies
   cd frontend
   npm install
   
   # Install backend dependencies
   cd ../backend
   npm install
   ```

3. Configure environment variables:
   
   **Backend (.env)**:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/sportnexus
   JWT_SECRET=your_jwt_secret_key
   NODE_ENV=development
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   ```
   
   **Frontend (.env)**:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

### Database Setup

#### Option 1: Local MongoDB Installation

1. Install MongoDB Community Edition:
   - [Windows Installation Guide](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/)
   - [macOS Installation Guide](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-os-x/)
   - [Linux Installation Guide](https://docs.mongodb.com/manual/administration/install-on-linux/)

2. Start MongoDB service:
   - Windows: `net start MongoDB`
   - macOS: `brew services start mongodb-community`
   - Linux: `sudo systemctl start mongod`

#### Option 2: MongoDB Atlas (Cloud)

1. Create a MongoDB Atlas account and set up a free cluster
2. Update the `MONGODB_URI` in the `backend/.env` file with your MongoDB Atlas connection string.

### Stripe Setup

1. Create a [Stripe account](https://stripe.com) and get your API keys
2. Add your Stripe secret key to the backend `.env` file
3. Set up a webhook in your Stripe dashboard pointing to `http://your-domain.com/api/payments/webhook`
4. Add the webhook signing secret to your backend `.env` file

### Admin Account Setup

To create an admin account:
1. Register a new user through the application
2. Use MongoDB Compass or mongo shell to update the user's role:
```
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

### Starting the Application

1. Start the backend:
   ```
   cd backend
   npm run dev
   ```

2. Start the frontend (in a new terminal):
   ```
   cd frontend
   npm run dev
   ```

3. Access the application:
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:5000

## Testing

### Running Tests

1. Backend tests:
   ```
   cd backend
   npm test
   ```

2. Frontend tests:
   ```
   cd frontend
   npm test
   ```

## API Endpoints

### Auth Routes
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user profile (protected)

### Venue Routes
- `GET /api/venues` - Get all venues
- `GET /api/venues/:id` - Get venue by ID
- `POST /api/venues` - Create a new venue (admin only)
- `PUT /api/venues/:id` - Update venue (admin only)
- `DELETE /api/venues/:id` - Delete venue (admin only)

### Equipment Routes
- `GET /api/equipment` - Get all equipment
- `GET /api/equipment/:id` - Get equipment by ID
- `POST /api/equipment` - Create new equipment (admin only)
- `PUT /api/equipment/:id` - Update equipment (admin only)
- `DELETE /api/equipment/:id` - Delete equipment (admin only)

### Tutorial Routes
- `GET /api/tutorials` - Get all tutorials
- `GET /api/tutorials/:id` - Get tutorial by ID
- `POST /api/tutorials` - Create new tutorial (admin only)
- `PUT /api/tutorials/:id` - Update tutorial (admin only)
- `DELETE /api/tutorials/:id` - Delete tutorial (admin only)

### Booking Routes
- `GET /api/bookings` - Get user's bookings
- `POST /api/bookings` - Create a new booking
- `GET /api/bookings/:id` - Get booking by ID
- `PUT /api/bookings/:id` - Update booking status

### Payment Routes
- `POST /api/payments` - Create a payment intent
- `GET /api/payments/history` - Get payment history
- `POST /api/payments/refund` - Process a refund (admin only)
- `POST /api/payments/webhook` - Stripe webhook endpoint

### Wallet Routes
- `GET /api/wallet` - Get user's wallet
- `POST /api/wallet/funds` - Add funds to wallet
- `POST /api/wallet/funds/process` - Process wallet funding
- `GET /api/wallet/transactions` - Get wallet transaction history

### Review Routes
- `GET /api/reviews/:itemType/:itemId` - Get reviews for an item
- `POST /api/reviews` - Create a new review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

### Admin Routes
- `GET /api/admin/bookings` - Get bookings for admin items
- `PATCH /api/admin/booking-status` - Update booking status
- `POST /api/admin/migrate-data` - Run data migration

## Troubleshooting

### MongoDB Connection Issues

1. Check if MongoDB is running locally:
   - Windows: `netstat -ano | findstr "27017"`
   - macOS/Linux: `ps -ef | grep mongod`

2. Verify your connection string in `.env` file is correct

3. If using MongoDB Atlas:
   - Verify your IP address is whitelisted in Network Access
   - Check if username and password are correct
   - Ensure the cluster is running

### API Connection Issues

1. Verify the backend server is running on the expected port

2. Check if the `VITE_API_URL` in the frontend `.env` file matches the backend URL

3. Look for CORS errors in the browser console and ensure the backend CORS configuration is correct

4. Verify that the Vite development server is properly configured with the proxy settings

### Wallet and Payment Issues

1. If wallet payments fail:
   - Check console logs for detailed error messages
   - Verify that the user has sufficient balance
   - Ensure the wallet service is properly connected to the database

2. If Stripe payments fail:
   - Verify Stripe keys in environment variables
   - Check for Stripe webhook configuration issues
   - Look for errors in the Stripe dashboard

### Authentication Problems

1. For login failures:
   - Check if the user exists in the database
   - Verify password is correct
   - Look for token validation issues in server logs

2. For authorization issues:
   - Verify the token is being sent correctly in the Authorization header
   - Check if token has expired
   - Ensure the user has the correct role for restricted routes

## Roadmap

### Planned Features

1. **Enhanced Payment Integration**
   - Additional payment gateways
   - Subscription management
   - Enhanced invoicing system
   - Improved refund handling

2. **Advanced Search & Filtering**
   - Location-based search for venues and equipment
   - More advanced filtering options
   - Search by availability

3. **Notification System**
   - Email notifications for booking status changes
   - In-app notification center
   - Reminder notifications for upcoming bookings

4. **User Dashboard Improvements**
   - More detailed booking history
   - Favorites or wishlist functionality
   - Personal usage statistics

5. **Mobile Applications**
   - Native mobile apps for iOS and Android
   - Mobile-specific features and optimizations

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
