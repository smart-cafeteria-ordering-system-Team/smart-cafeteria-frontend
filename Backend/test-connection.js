require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;
console.log('Testing connection to:', uri.replace(/:[^:@]+@/, ':****@'));

mongoose.connect(uri, {
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    family: 4
})
.then(() => {
    console.log('✅ Connected successfully!');
    console.log('Database:', mongoose.connection.name);
    process.exit(0);
})
.catch(err => {
    console.error('❌ Connection failed:', err.message);
    console.error('Full error:', err);
    process.exit(1);
});