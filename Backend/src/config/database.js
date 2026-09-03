const mongoose = require('mongoose');
const { MONGODB_URI } = require('./env');

const mongooseOptions = {
  // Atlas server discovery can take >10s on some networks (DNS/SRV lookups for
  // multiple shard hosts). Use a generous timeout so startup does not fail
  // prematurely. Verified working with these values on this machine.
  serverSelectionTimeoutMS: 40000, // Allow up to 40s for Atlas server discovery
  connectTimeoutMS: 40000,
  socketTimeoutMS: 100000,
  family: 4, // Force IPv4 to avoid IPv6 routing/dns lookup timeouts
};

const connectDatabase = async () => {
  const mongoUri = MONGODB_URI || process.env.MONGODB_URI || process.env.MONGO_URI;

  console.log(
    `[MongoDB] Diagnostics: process.env.MONGODB_URI is ${process.env.MONGODB_URI ? 'SET' : 'NOT SET'}`
  );
  console.log(
    `[MongoDB] Diagnostics: MONGODB_URI from env module is ${mongoUri ? 'SET' : 'NOT SET'}`
  );

  if (!mongoUri) {
    throw new Error(
      '[MongoDB] MONGODB_URI is not set in .env. Please add: MONGODB_URI=mongodb+srv://...'
    );
  }

  try {
    mongoose.set('strictQuery', false);

    console.log(`[MongoDB] Connecting to Atlas...`);

    await mongoose.connect(mongoUri, mongooseOptions);

    console.log(`✓ [MongoDB] Connected Successfully to MongoDB Atlas`);
    return mongoose.connection;
  } catch (error) {
    console.error(`✗ [MongoDB] Connection failed: ${error.message}`);
    console.error('==============================================================');
    console.error('[MongoDB] Troubleshooting checklist:');
    console.error('  1. MongoDB Atlas IP Whitelist: Open Atlas -> Network Access ->');
    console.error('     Add 0.0.0.0/0 (Allow access from anywhere) for development.');
    console.error('  2. Verify MONGODB_URI in the .env file is correct and includes');
    console.error('     the database name and credentials.');
    console.error('  3. Confirm MongoDB Atlas cluster is running (green status).');
    console.error('  4. Check your internet/DNS connectivity.');
    console.error('==============================================================');
    throw error; // Don't silently fail - let server.js handle it
  }
};

module.exports = connectDatabase;
