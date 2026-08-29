const mongoose = require('mongoose');

const connectDatabase = async () => {
	const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
	if (!uri) throw new Error('MONGODB_URI is not configured');

	await mongoose.connect(uri, {
		serverSelectionTimeoutMS: 30000,
		connectTimeoutMS: 30000,
		family: 4
	});
	console.log(`MongoDB connected: ${mongoose.connection.name}`);
};

module.exports = connectDatabase;
