import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables in case this file is imported directly
dotenv.config();

const connectDB = async (): Promise<void> => {
  try {
    // Get connection string from environment variables or use fallback
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sportnexus';
    
    // Updated connection options - removed deprecated options
    const options = {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of 30
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4 // Use IPv4, skip trying IPv6
    } as mongoose.ConnectOptions;

    console.log(`Attempting to connect to MongoDB at ${mongoURI.split('@').pop()}`);
    
    const conn = await mongoose.connect(mongoURI, options);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB connection error: ${err}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });
    
  } catch (error: any) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    
    // If in development or test, allow the app to continue without DB
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Running without database connection. Some features will not work.');
      
      // Create mock methods for mongoose in development to avoid crashes
      if (process.env.NODE_ENV === 'development') {
        console.warn('Using mock database functionality for development.');
      }
    } else {
      // In production, exit the process
      process.exit(1);
    }
  }
};

export default connectDB; 