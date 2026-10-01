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
    // Without a database, fail fast instead of letting queries hang for 10s;
    // the controllers use the in-memory store (utils/devStore.js) in this mode.
    mongoose.set('bufferCommands', false);
    console.warn(`⚠️ MongoDB connection warning: ${err.message}`);
    console.warn(`👉 Tip: If you don't have MongoDB installed locally, paste your free MongoDB Atlas URI into animal-rescue-backend/.env`);
    console.warn(`👉 Running in demo mode: data is kept in memory and saved to data/dev-store.json, so it survives restarts.`);
  }
};

module.exports = connectDB;
