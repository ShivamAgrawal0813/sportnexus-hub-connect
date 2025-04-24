import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import venueRoutes from './routes/venueRoutes';
import equipmentRoutes from './routes/equipmentRoutes';
import tutorialRoutes from './routes/tutorialRoutes';
import bookingRoutes from './routes/bookingRoutes';
import reviewRoutes from './routes/reviewRoutes';
import adminRoutes from './routes/adminRoutes';
import paymentRoutes from './routes/paymentRoutes';
import walletRoutes from './routes/walletRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import discountRoutes from './routes/discountRoutes';
import { isMongoDBRunning, getMongoDBInstallInstructions } from './utils/mongoCheck';

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB with a check
const initializeDatabase = async () => {
  try {
    // Check if we're using a local MongoDB connection
    if (process.env.MONGODB_URI?.includes('localhost') || process.env.MONGODB_URI?.includes('127.0.0.1')) {
      const isRunning = await isMongoDBRunning();
      if (!isRunning) {
        console.error('\x1b[31m%s\x1b[0m', 'MongoDB is not running locally!');
        console.log('\x1b[33m%s\x1b[0m', getMongoDBInstallInstructions());
        // Continue anyway for development purposes
      }
    }
    
    // Attempt to connect to MongoDB
    await connectDB();
    console.log('\x1b[32m%s\x1b[0m', 'Database connection initialized');
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'Failed to initialize database:', error);
  }
};

// Define routes
app.use('/api/auth', authRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/tutorials', tutorialRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/discounts', discountRoutes);

// Test route to verify API functionality
app.get('/api/test', (req: Request, res: Response) => {
  res.json({ success: true, message: 'API is working correctly!' });
});

// Test POST route to verify request body parsing
app.post('/api/test-post', (req: Request, res: Response) => {
  console.log('Received POST data:', req.body);
  res.json({ 
    success: true, 
    message: 'POST request received successfully!',
    receivedData: req.body
  });
});

// Base route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to SportNexus Hub API' });
});

// MongoDB connection status route
app.get('/api/status', (req: Request, res: Response) => {
  const isConnected = !!connectDB && !!global.mongoose;
  
  res.json({
    database: isConnected ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
});

// Set port and start server
const PORT = process.env.PORT || 5000;

// Initialize the server
const startServer = async () => {
  await initializeDatabase();
  
  app.listen(PORT, () => {
    console.log('\x1b[36m%s\x1b[0m', `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log('\x1b[36m%s\x1b[0m', `API available at http://localhost:${PORT}/api`);
  });
};

startServer(); 