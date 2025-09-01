#!/usr/bin/env node

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

require('dotenv').config();
const { Recording, Transcript } = require('./models');

async function debugRecordings() {
  console.log('🔍 DEBUGGING RECORDING DISPLAY ISSUE\n');
  
  try {
    // 1. Database Check
    console.log('📊 DATABASE:');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/transcribeapp');
    
    const recordings = await Recording.find({}).sort({ createdAt: -1 }).lean();
    console.log(`   Records: ${recordings.length}`);
    
    recordings.forEach((rec, i) => {
      console.log(`   ${i+1}. ${rec.originalName || rec.filename}`);
      console.log(`      - File: ${rec.filename}`);
      console.log(`      - Size: ${(rec.size/1024).toFixed(1)} KB`);
      console.log(`      - Status: ${rec.transcriptionStatus}`);
      console.log(`      - Created: ${new Date(rec.createdAt).toLocaleTimeString()}`);
    });

    // 2. File System Check
    console.log('\n📁 FILE SYSTEM:');
    const uploadFiles = fs.readdirSync('./uploads').filter(f => !f.startsWith('.'));
    console.log(`   Files: ${uploadFiles.length}`);
    
    uploadFiles.forEach((file, i) => {
      const stat = fs.statSync(`./uploads/${file}`);
      console.log(`   ${i+1}. ${file} (${(stat.size/1024).toFixed(1)} KB)`);
    });

    // 3. API Check
    console.log('\n🌐 API:');
    try {
      const response = await axios.get('http://localhost:3001/recordings');
      const apiRecordings = response.data.recordings || [];
      console.log(`   API Returns: ${apiRecordings.length} recordings`);
      
      apiRecordings.forEach((rec, i) => {
        console.log(`   ${i+1}. ${rec.filename} (${(rec.size/1024).toFixed(1)} KB)`);
      });
    } catch (apiError) {
      console.log(`   ❌ API Error: ${apiError.message}`);
    }

    // 4. Summary
    console.log('\n📋 SUMMARY:');
    console.log(`   Database: ${recordings.length} records`);
    console.log(`   Files: ${uploadFiles.length} files`);
    
    if (recordings.length === uploadFiles.length) {
      console.log('   ✅ Database and files match!');
    } else {
      console.log('   ⚠️  Mismatch detected!');
    }

    console.log('\n💡 WHY YOU MIGHT SEE 3 RECORDINGS:');
    console.log('   1. Frontend shows TWO sections:');
    console.log('      a) "Current Session" recordings (in browser memory)');
    console.log('      b) "Saved Recordings" (from database)');
    console.log('   2. If you recorded 2 files but one is still in memory');
    console.log('      and both are in database, you would see 1 + 2 = 3 total');
    console.log('   3. Check your browser - refresh the page to sync');

    console.log('\n🔧 TO FIX:');
    console.log('   1. Refresh your browser (Cmd+Shift+R on Mac)');
    console.log('   2. Clear browser cache/local storage');
    console.log('   3. Check if multiple browser tabs are open');

    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugRecordings();
