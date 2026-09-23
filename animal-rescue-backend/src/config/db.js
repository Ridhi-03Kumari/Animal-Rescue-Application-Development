const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/animal_rescue';
  try {
    console.log(`Connecting to MongoDB...`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // 5s timeout instead of 30s
    });
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.warn(`⚠️ MongoDB connection warning: ${err.message}`);
    console.warn(`👉 Tip: If you don't have MongoDB installed locally, paste your free MongoDB Atlas URI into animal-rescue-backend/.env`);
    console.warn(`👉 The server is still running so you can test health, contacts, AI triage, and real-time sockets!`);
  }
};

module.exports = connectDB;
