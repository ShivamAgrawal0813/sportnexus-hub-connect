import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Venue from '../models/Venue';
import Equipment from '../models/Equipment';
import User from '../models/User';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sportnexus');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const migrateData = async () => {
  try {
    await connectDB();
    
    // Find an admin user to assign as creator
    const adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      console.error('No admin user found. Cannot proceed with migration.');
      process.exit(1);
    }
    
    console.log(`Found admin user: ${adminUser.name} (${adminUser._id})`);
    
    // Update venues without creator field
    const venueUpdateResult = await Venue.updateMany(
      { creator: { $exists: false } },
      { $set: { creator: adminUser._id } }
    );
    
    console.log(`Updated ${venueUpdateResult.modifiedCount} venues with creator field`);
    
    // Update equipment without creator field
    const equipmentUpdateResult = await Equipment.updateMany(
      { creator: { $exists: false } },
      { $set: { creator: adminUser._id } }
    );
    
    console.log(`Updated ${equipmentUpdateResult.modifiedCount} equipment items with creator field`);
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error(`Migration error: ${error.message}`);
    process.exit(1);
  }
};

migrateData(); 