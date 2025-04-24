import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const testMongoConnection = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sportnexus';
    console.log('Attempting to connect to MongoDB at:', mongoURI);
    
    const conn = await mongoose.connect(mongoURI);
    console.log(`MongoDB Connected successfully: ${conn.connection.host}`);
    
    // Create a simple test model and document
    const TestSchema = new mongoose.Schema({
      name: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    });
    
    const Test = mongoose.models.Test || mongoose.model('Test', TestSchema);
    
    // Create a test document
    const testDoc = new Test({ name: 'Connection Test' });
    await testDoc.save();
    console.log('Test document created successfully:', testDoc);
    
    // Find the document
    const docs = await Test.find({});
    console.log(`Found ${docs.length} documents in the Test collection`);
    
    // Delete the test document
    await Test.deleteMany({ name: 'Connection Test' });
    console.log('Test documents removed');
    
    // Close the connection
    await mongoose.disconnect();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('MongoDB connection test failed:', error);
  }
};

// Run the test
testMongoConnection(); 