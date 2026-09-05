const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');

async function seedAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@cafeteria.com';
    const adminName = process.env.ADMIN_NAME || 'System Admin';
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      throw new Error(
        'ADMIN_PASSWORD is required. Run: npm run seed:admin after setting ADMIN_PASSWORD in Backend/.env'
      );
    }

    await mongoose.connect(process.env.MONGODB_URI);
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const adminData = {
      name: adminName,
      email: adminEmail,
      username: adminEmail.split('@')[0],
      password: hashedPassword,
      role: 'admin',
      isActive: true
    };

    await User.findOneAndUpdate(
      { email: adminEmail },
      adminData,
      { upsert: true, new: true }
    );

    console.log('Admin account created/updated successfully!');
    console.log(`Email: ${adminEmail}`);
    console.log('Password: (from ADMIN_PASSWORD - not printed for security)');
    process.exit(0);
  } catch (err) {
    console.error('Failed to create admin:', err.message);
    process.exit(1);
  }
}

seedAdmin();