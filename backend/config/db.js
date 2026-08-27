const mongoose = require("mongoose");

let isConnected = false;

async function connectDB() {
  if (isConnected || mongoose.connection.readyState >= 1) {
    isConnected = true;
    return;
  }

  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("MONGO_URI is not set. Add it to your .env file.");
    if (process.env.VERCEL) {
      throw new Error("MONGO_URI is missing in Vercel Environment Variables");
    }
    process.exit(1);
  }

  try {
    const db = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging 30s
    });
    isConnected = db.connections[0].readyState >= 1;
    console.log("MongoDB connected successfully:", mongoose.connection.host);
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
    throw err;
  }
}

module.exports = connectDB;
