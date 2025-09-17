#!/usr/bin/env node

/**
 * Simple Data Cleanup Script
 * Clears all data from the transcription app
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Import models
const { Recording, Transcript, IngestedDocument, ChatSession } = require('./models');

// Database connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/transcribeapp';
    console.log(`🔌 Connecting to MongoDB...`);
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('💡 Make sure MongoDB is running');
    process.exit(1);
  }
};

// Clear directory contents
const clearDirectory = (dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      console.log(`📁 Directory ${dirPath} doesn't exist, creating it...`);
      fs.mkdirSync(dirPath, { recursive: true });
      return 0;
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
        const subDeleted = clearDirectory(filePath);
        deletedCount += subDeleted;
        try {
          fs.rmdirSync(filePath);
          deletedCount++;
        } catch (e) {
          // Directory might not be empty, skip
        }
      }
    }

    return deletedCount;
  } catch (error) {
    console.error(`❌ Error clearing directory ${dirPath}:`, error.message);
    return 0;
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
    
    let chatSessionsCount = 0;
    try {
      chatSessionsCount = await ChatSession.countDocuments();
    } catch (e) {
      console.log('   - Chat Sessions collection not found (this is normal)');
    }

    console.log(`   - Recordings: ${recordingsCount}`);
    console.log(`   - Transcripts: ${transcriptsCount}`);
    console.log(`   - Documents: ${documentsCount}`);
    console.log(`   - Chat Sessions: ${chatSessionsCount}`);

    if (recordingsCount > 0) {
      await Recording.deleteMany({});
      console.log('   ✅ Recordings cleared');
    }
    
    if (transcriptsCount > 0) {
      await Transcript.deleteMany({});
      console.log('   ✅ Transcripts cleared');
    }
    
    if (documentsCount > 0) {
      await IngestedDocument.deleteMany({});
      console.log('   ✅ Documents cleared');
    }
    
    if (chatSessionsCount > 0) {
      await ChatSession.deleteMany({});
      console.log('   ✅ Chat sessions cleared');
    }

    console.log('✅ All database collections cleared');

    // 2. Clear file system directories
    console.log('\n📁 Clearing file system...');
    
    const uploadsDir = path.join(__dirname, 'uploads');
    const transcriptsDir = path.join(__dirname, 'transcripts');
    
    const uploadsDeleted = clearDirectory(uploadsDir);
    const transcriptsDeleted = clearDirectory(transcriptsDir);
    
    console.log(`🗑️  Cleared ${uploadsDeleted} files from uploads`);
    console.log(`🗑️  Cleared ${transcriptsDeleted} files from transcripts`);

    // 3. Create .gitkeep files to preserve directory structure
    const gitkeepContent = '# This file keeps the directory in git\n';
    
    fs.writeFileSync(path.join(uploadsDir, '.gitkeep'), gitkeepContent);
    fs.writeFileSync(path.join(transcriptsDir, '.gitkeep'), gitkeepContent);

    console.log('✅ Directory structure preserved with .gitkeep files');

    console.log('\n🎉 Complete cleanup finished successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Deleted ${recordingsCount + transcriptsCount + documentsCount + chatSessionsCount} database records`);
    console.log(`   - Deleted ${uploadsDeleted} audio files`);
    console.log(`   - Deleted ${transcriptsDeleted} transcript files`);
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

// Execute
console.log('⚠️  WARNING: This will DELETE ALL DATA!');
console.log('   - All recordings will be deleted');
console.log('   - All transcripts will be deleted');
console.log('   - All uploaded documents will be deleted');
console.log('   - All chat history will be deleted');
console.log('   - All files will be deleted');
console.log('\n🧹 Starting cleanup NOW!\n');

main();
