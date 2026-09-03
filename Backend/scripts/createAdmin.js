const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const hashedPassword = await bcrypt.hash('Cafe@2026!Secure', 10);

    const adminData = {
      name: 'System Admin',
      email: 'admin@cafeteria.com',
      username: 'smartcafeteria_admin',
      password: hashedPassword,
      role: 'admin',
      isActive: true
    };

    await User.findOneAndUpdate(
      { email: 'admin@cafeteria.com' },
      adminData,
      { upsert: true, new: true }
    );

    console.log('Admin account created/updated successfully!');
    console.log('Email: admin@cafeteria.com');
    console.log('Password: Cafe@2026!Secure');
    process.exit(0);
  } catch (err) {
    console.error('Failed to create admin:', err);
    process.exit(1);
  }
}

seedAdmin();
