require('dotenv').config();
const mongoose = require('mongoose');
const connectDatabase = require('../config/database');
const User = require('../models/User');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');

const categories = [
  {
    id: 'breakfast',
    name: { en: 'Breakfast', am: 'ቁርስ' },
    icon: '🍳',
    description: { en: 'Start your day with these delicious breakfast options', am: 'ቀንዎን በእነዚህ ጣፋጭ የቁርስ አማራጮች ይጀምሩ' },
    sortOrder: 1
  },
  {
    id: 'mains',
    name: { en: 'Main Meals', am: 'ዋና ምግቦች' },
    icon: '🍲',
    description: { en: 'Hearty traditional and modern main courses', am: 'ልዩ የሀገር ባህል እና ዘመናዊ ዋና ምግቦች' },
    sortOrder: 2
  },
  {
    id: 'fasting',
    name: { en: 'Fasting', am: 'የፆም ምግቦች' },
    icon: '🥗',
    description: { en: 'Delicious vegetarian and vegan options', am: 'ጣፋጭ የቬጀቴሪያን እና ቪጋን አማራጮች' },
    sortOrder: 3
  },
  {
    id: 'beverages',
    name: { en: 'Beverages', am: 'መጠጦች' },
    icon: '🥤',
    description: { en: 'Hot and cold drinks', am: 'ትኩስ እና ቀዝቃዛ መጠጦች' },
    sortOrder: 4
  }
];

const menuItems = [
  {
    name: { en: 'Special Doro Wat', am: 'ልዩ ዶሮ ወጥ' },
    category: 'mains',
    price: 250,
    description: { en: 'Special traditional Ethiopian chicken stew served with hard-boiled eggs', am: 'ልዩ የሀገር ባህል ዶሮ ወጥ ከእንቁላል ጋር' },
    icon: '🍗',
    preparationTime: 15,
    isAvailable: true
  },
  {
    name: { en: 'Shiro Tegabino', am: 'ሽሮ ተጋቢኖ' },
    category: 'fasting',
    price: 120,
    description: { en: 'Spicy chickpea stew bubbling in a traditional clay pot', am: 'በሸክላ ድስት የሚፈስስ ቅመም ያለው የሽሮ ወጥ' },
    icon: '🍲',
    preparationTime: 10,
    isAvailable: true
  },
  {
    name: { en: 'Fasting Firfir', am: 'የፆም ፍርፍር' },
    category: 'fasting',
    price: 100,
    description: { en: 'Shredded injera sautéed in red pepper sauce and spices', am: 'የተፈተፈተ እንጀራ በኮረሪማ እና በርበሬ የተጠበሰ' },
    icon: '🌶️',
    preparationTime: 8,
    isAvailable: true
  },
  {
    name: { en: 'Special scrambled eggs', am: 'ልዩ የተገረፈ እንቁላል' },
    category: 'breakfast',
    price: 90,
    description: { en: 'Scrambled eggs with onions, green peppers, and tomatoes, served with bread', am: 'የተገረፈ እንቁላል በሽንኩርት፣ ቃሪያ እና ቲማቲም፣ ከዳቦ ጋር' },
    icon: '🍳',
    preparationTime: 5,
    isAvailable: true
  },
  {
    name: { en: 'Spris Juice', am: 'ስፕሪስ ጭማቂ' },
    category: 'beverages',
    price: 60,
    description: { en: 'Layered avocado, mango, and papaya fresh juices', am: 'የተደራረበ የትርፍ አቮካዶ፣ ማንጎ እና ፓፓያ ትኩስ ጭማቂ' },
    icon: '🥑',
    preparationTime: 5,
    isAvailable: true
  },
  {
    name: { en: 'Macchiato', am: 'ማኪያቶ' },
    category: 'beverages',
    price: 45,
    description: { en: 'Rich espresso topped with steamed milk froth', am: 'ጣፋጭ ኤስፕሬሶ በተፈላ ወተት አረፋ' },
    icon: '☕',
    preparationTime: 3,
    isAvailable: true
  }
];

const users = [
  {
    name: 'Admin User',
    email: 'admin@cafeteria.com',
    phone: '0911223344',
    password: 'password123',
    role: 'admin',
    balance: 5000,
    status: 'ACTIVE'
  },
  {
    name: 'Kitchen Staff',
    email: 'kitchen@cafeteria.com',
    phone: '0911556677',
    password: 'password123',
    role: 'kitchen',
    balance: 0,
    status: 'ACTIVE'
  },
  {
    name: 'Customer User',
    email: 'customer@cafeteria.com',
    phone: '0922334455',
    password: 'password123',
    role: 'customer',
    balance: 1000,
    status: 'ACTIVE'
  }
];

const seedData = async () => {
  try {
    console.log('Connecting to database...');
    await connectDatabase();
    console.log('Connected.');

    // Clear existing data
    console.log('Clearing existing database collections...');
    await User.deleteMany({});
    await Category.deleteMany({});
    await MenuItem.deleteMany({});
    console.log('Cleared collections.');

    // Insert categories
    console.log('Seeding categories...');
    const createdCategories = await Category.insertMany(categories);
    console.log(`Successfully seeded ${createdCategories.length} categories.`);

    // Insert menu items
    console.log('Seeding menu items...');
    const createdMenuItems = await MenuItem.insertMany(menuItems);
    console.log(`Successfully seeded ${createdMenuItems.length} menu items.`);

    // Insert users
    console.log('Seeding users...');
    // We iterate to trigger mongoose pre-save hook for password hashing
    for (const u of users) {
      await User.create(u);
    }
    console.log(`Successfully seeded ${users.length} users.`);

    console.log('Database seeded successfully! 🎉');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
