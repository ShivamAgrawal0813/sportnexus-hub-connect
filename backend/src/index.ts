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
import paymentRetry from './utils/paymentRetry';
import logger from './utils/logger';

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
        logger.error('MongoDB is not running locally!');
        logger.info(getMongoDBInstallInstructions());
        // Continue anyway for development purposes
      }
    }
    
    // Attempt to connect to MongoDB
    await connectDB();
    logger.info('Database connection initialized');
  } catch (error) {
    logger.error('Failed to initialize database:', { error });
  }
};

// Setup payment retry scheduler
const setupPaymentRetryScheduler = () => {
  // Initial run on server start after a short delay
  setTimeout(() => {
    paymentRetry.scheduleFailedPaymentRetries()
      .catch(error => logger.error('Error in initial payment retry schedule', { error }));
  }, 10000); // Wait 10 seconds after server start
  
  // Schedule to run every hour
  const ONE_HOUR = 60 * 60 * 1000;
  setInterval(() => {
    paymentRetry.scheduleFailedPaymentRetries()
      .catch(error => logger.error('Error in scheduled payment retry', { error }));
  }, ONE_HOUR);
  
  logger.info('Payment retry scheduler initialized');
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
  logger.debug('Received POST data', { body: req.body });
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
    logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    logger.info(`API available at http://localhost:${PORT}/api`);
    
    // Setup payment retry scheduler after server starts
    setupPaymentRetryScheduler();
  });
};

startServer(); 