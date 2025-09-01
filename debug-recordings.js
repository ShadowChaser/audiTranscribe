#!/usr/bin/env node

/**
 * Debug Recordings Script
 * Helps identify why you might be seeing 3 recordings instead of 2
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Load environment variables
require('dotenv').config({ path: './backend/.env' });

// Import models
const { Recording, Transcript, IngestedDocument } = require('./backend/models');

async function debugRecordings() {
  console.log('🔍 DEBUGGING RECORDING DISPLAY ISSUE\n');
  
  try {
    // 1. Check Database
    console.log('📊 1. DATABASE CHECK:');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/transcribeapp');
    
    const recordings = await Recording.find({}).sort({ createdAt: -1 }).lean();
    const transcripts = await Transcript.find({}).sort({ createdAt: -1 }).lean();
    
    console.log(`   Database Recordings: ${recordings.length}`);
    console.log(`   Database Transcripts: ${transcripts.length}`);
    
    if (recordings.length > 0) {
      console.log('\n   📝 Recording Details:');
      recordings.forEach((rec, i) => {
        console.log(`   ${i+1}. ${rec.filename} (${rec.originalName})`);
        console.log(`      - Size: ${rec.size} bytes`);
        console.log(`      - Status: ${rec.transcriptionStatus}`);
        console.log(`      - Created: ${rec.createdAt}`);
      });
    }

    // 2. Check File System
    console.log('\n📁 2. FILE SYSTEM CHECK:');
    const uploadsDir = path.join(__dirname, 'backend/uploads');
    const transcriptsDir = path.join(__dirname, 'backend/transcripts');
    
    if (fs.existsSync(uploadsDir)) {
      const uploadFiles = fs.readdirSync(uploadsDir).filter(f => !f.startsWith('.'));
      console.log(`   Upload Files: ${uploadFiles.length}`);
      uploadFiles.forEach((file, i) => {
        const filePath = path.join(uploadsDir, file);
        const stat = fs.statSync(filePath);
        console.log(`   ${i+1}. ${file} (${stat.size} bytes)`);
      });
    }
    
    if (fs.existsSync(transcriptsDir)) {
      const transcriptFiles = fs.readdirSync(transcriptsDir).filter(f => !f.startsWith('.'));
      console.log(`   Transcript Files: ${transcriptFiles.length}`);
      transcriptFiles.forEach((file, i) => {
        console.log(`   ${i+1}. ${file}`);
      });
    }

    // 3. Check API Response
    console.log('\n🌐 3. API RESPONSE CHECK:');
    try {
      const response = await axios.get('http://localhost:3001/recordings');
      const apiRecordings = response.data.recordings || [];
      console.log(`   API Returns: ${apiRecordings.length} recordings`);
      
      if (apiRecordings.length > 0) {
        console.log('\n   📋 API Recording List:');
        apiRecordings.forEach((rec, i) => {
          console.log(`   ${i+1}. ${rec.filename}`);
          console.log(`      - Size: ${rec.size} bytes`);
          console.log(`      - Status: ${rec.transcriptionStatus}`);
          console.log(`      - Has Transcript: ${rec.hasTranscript}`);
        });
      }
    } catch (apiError) {
      console.log(`   ❌ API Error: ${apiError.message}`);
      console.log('   💡 Make sure the backend server is running on port 3001');
    }

    // 4. Check for inconsistencies
    console.log('\n🔍 4. INCONSISTENCY CHECK:');
    const uploadFiles = fs.existsSync(uploadsDir) ? 
      fs.readdirSync(uploadsDir).filter(f => !f.startsWith('.')) : [];
    
    console.log(`   Database has ${recordings.length} records`);
    console.log(`   File system has ${uploadFiles.length} files`);
    
    if (recordings.length !== uploadFiles.length) {
      console.log('   ⚠️  MISMATCH DETECTED!');
      
      // Find orphaned files
      const recordingFiles = recordings.map(r => r.filename.replace(/^external_\d+_/, ''));
      const orphanedFiles = uploadFiles.filter(file => 
        !recordingFiles.includes(file)
      );
      
      if (orphanedFiles.length > 0) {
        console.log('   🗂️  Orphaned Files (files without database records):');
        orphanedFiles.forEach(file => console.log(`      - ${file}`));
      }
      
      // Find missing files
      const missingFiles = recordings.filter(rec => {
        const actualFilename = rec.filename.replace(/^external_\d+_/, '');
        return !uploadFiles.includes(actualFilename);
      });
      
      if (missingFiles.length > 0) {
        console.log('   🔍 Missing Files (database records without files):');
        missingFiles.forEach(rec => console.log(`      - ${rec.filename}`));
      }
    } else {
      console.log('   ✅ Database and file system are in sync');
    }

    // 5. Possible explanations
    console.log('\n💡 5. POSSIBLE EXPLANATIONS FOR SEEING 3 RECORDINGS:');
    console.log('   a) Frontend might be showing:');
    console.log('      - Current session recordings (in browser memory)');
    console.log('      - Plus saved recordings (from database)');
    console.log('   b) Browser cache might be showing old data');
    console.log('   c) Multiple browser tabs might have different states');
    console.log('   d) Auto-save might have failed for one recording');

    console.log('\n🔧 6. RECOMMENDATIONS:');
    console.log('   1. Refresh your browser page (Ctrl+F5 or Cmd+Shift+R)');
    console.log('   2. Check browser console for any JavaScript errors');
    console.log('   3. Clear browser local storage for the app');
    console.log('   4. Check if you have multiple tabs open with the app');

    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Error during debug:', error.message);
  }
}

// Run the debug
debugRecordings();
