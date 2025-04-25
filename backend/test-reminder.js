// Script to manually test the booking reminder service
require('dotenv').config();
const mongoose = require('mongoose');
const { sendBookingReminders } = require('./dist/utils/bookingReminderService');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const testBookingReminders = async () => {
  console.log('Connecting to database...');
  await connectDB();
  
  console.log('Testing booking reminder service...');
  try {
    await sendBookingReminders();
    console.log('Reminder service test complete!');
  } catch (error) {
    console.error('Error testing reminder service:', error);
  }
  
  // Close connection
  await mongoose.connection.close();
  console.log('Database connection closed');
};

// Run the test
testBookingReminders(); 