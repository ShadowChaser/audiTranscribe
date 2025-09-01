#!/usr/bin/env node

/**
 * Clear All Data Script
 * 
 * This script will:
 * 1. Clear all MongoDB collections (recordings, transcripts, documents, chat sessions)
 * 2. Delete all uploaded audio files
 * 3. Delete all transcript files
 * 4. Reset the application to a clean state
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Import models from backend directory
const { Recording, Transcript, IngestedDocument, ChatSession } = require('./backend/models');

// Database connection using the same config as the app
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/transcribeapp';
    console.log(`🔌 Connecting to MongoDB: ${mongoURI.replace(/\/\/[^@]*@/, '//***:***@')}`);
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('💡 Make sure MongoDB is running and the connection string is correct');
    process.exit(1);
  }
};

// Clear directory contents
const clearDirectory = (dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      console.log(`📁 Directory ${dirPath} doesn't exist, skipping...`);
      return;
    }

    const files = fs.readdirSync(dirPath);
    let deletedCount = 0;

    for (const file of files) {
      // Skip .gitkeep files and hidden files
      if (file === '.gitkeep' || file.startsWith('.')) {
        continue;
      }

      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isFile()) {
        fs.unlinkSync(filePath);
        deletedCount++;
      } else if (stat.isDirectory()) {
        // Recursively delete subdirectories
        clearDirectory(filePath);
        fs.rmdirSync(filePath);
        deletedCount++;
      }
    }

    console.log(`🗑️  Cleared ${deletedCount} items from ${dirPath}`);
  } catch (error) {
    console.error(`❌ Error clearing directory ${dirPath}:`, error.message);
  }
};

// Main cleanup function
const clearAllData = async () => {
  console.log('🧹 Starting complete data cleanup...\n');

  try {
    // 1. Clear MongoDB collections
    console.log('📊 Clearing database collections...');
    
    const recordingsCount = await Recording.countDocuments();
    const transcriptsCount = await Transcript.countDocuments();
    const documentsCount = await IngestedDocument.countDocuments();
    const chatSessionsCount = await ChatSession.countDocuments();

    console.log(`   - Recordings: ${recordingsCount}`);
    console.log(`   - Transcripts: ${transcriptsCount}`);
    console.log(`   - Documents: ${documentsCount}`);
    console.log(`   - Chat Sessions: ${chatSessionsCount}`);

    await Recording.deleteMany({});
    await Transcript.deleteMany({});
    await IngestedDocument.deleteMany({});
    await ChatSession.deleteMany({});

    console.log('✅ All database collections cleared');

    // 2. Clear file system directories
    console.log('\n📁 Clearing file system...');
    
    const uploadsDir = path.join(__dirname, 'backend/uploads');
    const transcriptsDir = path.join(__dirname, 'backend/transcripts');
    
    clearDirectory(uploadsDir);
    clearDirectory(transcriptsDir);

    console.log('✅ All files cleared');

    // 3. Reset any other application state
    console.log('\n🔄 Resetting application state...');
    
    // Create .gitkeep files to preserve directory structure
    const gitkeepContent = '# This file keeps the directory in git\n';
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    fs.writeFileSync(path.join(uploadsDir, '.gitkeep'), gitkeepContent);
    
    if (!fs.existsSync(transcriptsDir)) {
      fs.mkdirSync(transcriptsDir, { recursive: true });
    }
    fs.writeFileSync(path.join(transcriptsDir, '.gitkeep'), gitkeepContent);

    console.log('✅ Directory structure preserved with .gitkeep files');

    console.log('\n🎉 Complete cleanup finished successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Deleted ${recordingsCount + transcriptsCount + documentsCount + chatSessionsCount} database records`);
    console.log('   - Cleared all uploaded audio files');
    console.log('   - Cleared all transcript files');
    console.log('   - Reset application to clean state');
    console.log('\n🚀 Your application is now ready for a fresh start!');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
};

// Run the cleanup
const main = async () => {
  try {
    await connectDB();
    await clearAllData();
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('💥 Cleanup failed:', error);
    process.exit(1);
  }
};

// Execute if run directly
if (require.main === module) {
  console.log('⚠️  WARNING: This will DELETE ALL DATA!');
  console.log('   - All recordings will be deleted');
  console.log('   - All transcripts will be deleted');
  console.log('   - All uploaded documents will be deleted');
  console.log('   - All chat history will be deleted');
  console.log('   - All files will be deleted');
  
  // Give user a moment to cancel
  setTimeout(() => {
    console.log('\n🚀 Starting cleanup in 3 seconds... Press Ctrl+C to cancel');
    setTimeout(() => {
      console.log('⏳ 2...');
      setTimeout(() => {
        console.log('⏳ 1...');
        setTimeout(() => {
          console.log('🧹 Starting cleanup NOW!\n');
          main();
        }, 1000);
      }, 1000);
    }, 1000);
  }, 1000);
}

module.exports = { clearAllData, clearDirectory };
