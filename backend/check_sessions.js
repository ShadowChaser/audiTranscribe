const mongoose = require('mongoose');
require('dotenv').config({ path: '../backend/.env' });
const { ChatSession } = require('../backend/models');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to DB");
  
  const sessions = await ChatSession.find({}).sort({ createdAt: -1 }).limit(5);
  console.log(`Found ${sessions.length} sessions`);
  
  sessions.forEach(s => {
    console.log(`Session: ${s._id} | Title: ${s.title} | Messages: ${s.messages.length} | Active: ${s.isActive}`);
  });
  
  await mongoose.disconnect();
}

check().catch(console.error);
