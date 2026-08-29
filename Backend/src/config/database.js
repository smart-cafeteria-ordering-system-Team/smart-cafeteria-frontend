const mongoose = require('mongoose');

const connectDatabase = async () => {
  const candidateUris = [
    process.env.MONGODB_URI || process.env.MONGO_URI,
    'mongodb://127.0.0.1:27017/smart_cafeteria',
    'mongodb://localhost:27017/smart_cafeteria',
  ].filter(Boolean);

  let lastError = null;

  for (const uri of [...new Set(candidateUris)]) {
    try {
      mongoose.set('strictQuery', false);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
      });

      console.log(`MongoDB connected successfully using: ${uri}`);
      return mongoose.connection;
    } catch (error) {
      lastError = error;
      console.warn(`MongoDB connection attempt failed for ${uri}: ${error.message}`);
    }
  }

  console.error('MongoDB connection failed for all configured URIs.');
  throw lastError || new Error('MongoDB connection failed.');
};

module.exports = connectDatabase;
module.exports.connectDatabase = connectDatabase;
