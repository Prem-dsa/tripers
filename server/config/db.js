const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('❌ MONGO_URI is not defined in environment variables.');
    console.error('   Please set MONGO_URI in your Render dashboard or .env file.');
    // Don't exit — let the server stay alive so Render can detect the port
    // and the health endpoint can report the issue.
    return false;
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log('✅ MongoDB Connected');
    return true;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error('   Check your MONGO_URI and network/whitelist settings.');
    // Don't call process.exit(1) — that kills the server and triggers
    // Render's "Application exited early" error. Instead, return false
    // so the server can start and report unhealthy via /health.
    return false;
  }
};

module.exports = connectDB;
