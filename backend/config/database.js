const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`📊 MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('connected', () => {
      console.log('📊 Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('📊 Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('📊 Mongoose disconnected');
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('📊 MongoDB connection closed due to application termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('📊 MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
