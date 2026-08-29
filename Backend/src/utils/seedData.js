const User = require('../models/User');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const Feedback = require('../models/Feedback');
const Cancellation = require('../models/Cancellation');

const seedCategories = [
  {
    id: 'breakfast',
    name: { en: 'Breakfast', am: 'ቁርስ' },
    icon: '🥞',
    description: { en: 'Sweet and savory breakfast options', am: 'ለቁርስ አስደሳች ምግቦች' },
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'main-meals',
    name: { en: 'Main Meal', am: 'ዋና ምግብ' },
    icon: '🍲',
    description: { en: 'Traditional Ethiopian lunch and dinner dishes', am: 'ባህላዊ ኢትዮጵያዊ ምግቦች' },
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'drinks',
    name: { en: 'Drinks', am: 'መጠጦች' },
    icon: '🥤',
    description: { en: 'Fresh beverages and traditional drinks', am: 'አዳዲስ መጠጦች' },
    isActive: true,
    sortOrder: 3,
  },
  {
    id: 'snacks',
    name: { en: 'Snacks', am: 'ካኬቶች' },
    icon: '🍪',
    description: { en: 'Quick bites and light snacks', am: 'ፈጣን እና ቀላል ካኬቶች' },
    isActive: true,
    sortOrder: 4,
  },
];

const seedMenuItems = [
  {
    name: { en: 'Injera', am: 'እንጀራ' },
    category: 'breakfast',
    price: 55,
    description: { en: 'Traditional sourdough flatbread', am: 'ባህላዊ እንጀራ' },
    icon: '🍞',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947',
    preparationTime: 8,
    availability: true,
    isAvailable: true,
  },
  {
    name: { en: 'Doro Wat', am: 'ዶሮ ዋት' },
    category: 'main-meals',
    price: 320,
    description: { en: 'Spicy chicken stew with egg and injera', am: 'በቅባት የተሞላ ዶሮ ዋት' },
    icon: '🍛',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554',
    preparationTime: 20,
    availability: true,
    isAvailable: true,
  },
  {
    name: { en: 'Kitfo', am: 'ክትፎ' },
    category: 'main-meals',
    price: 360,
    description: { en: 'Lean beef minced and served with mitmita and injera', am: 'ትንሽ እንግዶ ሥጋ ከሚትሚታ እና እንጀራ ጋር' },
    icon: '🥩',
    image: 'https://images.unsplash.com/photo-1559847844-5315695dadae',
    preparationTime: 18,
    availability: true,
    isAvailable: true,
  },
  {
    name: { en: 'Tibs', am: 'ጥብስ' },
    category: 'main-meals',
    price: 285,
    description: { en: 'Sautéed beef with onions and peppers', am: 'የተጠበሰ ሥጋ ከሽኮር እና በርሜል' },
    icon: '🍲',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
    preparationTime: 16,
    availability: true,
    isAvailable: true,
  },
  {
    name: { en: 'Shiro', am: 'ሽሮ' },
    category: 'main-meals',
    price: 170,
    description: { en: 'Purée of chickpeas and lentils in spicy sauce', am: 'ከባቄላ እና ምስር የተሠራ ሽሮ' },
    icon: '🥘',
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19',
    preparationTime: 15,
    availability: true,
    isAvailable: true,
  },
  {
    name: { en: 'Beyaynet', am: 'በየነት' },
    category: 'main-meals',
    price: 300,
    description: { en: 'Mixed vegetarian platter with multiple stews', am: 'የተለያዩ አትኩሮች ጋር የተዋሃዱ ጣዕም' },
    icon: '🥗',
    image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1',
    preparationTime: 18,
    availability: true,
    isAvailable: true,
  },
  {
    name: { en: 'Tea', am: 'ሻይ' },
    category: 'drinks',
    price: 45,
    description: { en: 'Fresh Ethiopian tea', am: 'ቀዝቀዝ የኢትዮጵያ ሻይ' },
    icon: '🍵',
    image: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7',
    preparationTime: 5,
    availability: true,
    isAvailable: true,
  },
  {
    name: { en: 'Coffee', am: 'ቡና' },
    category: 'drinks',
    price: 50,
    description: { en: 'Traditional Ethiopian coffee', am: 'ባህላዊ የኢትዮጵያ ቡና' },
    icon: '☕',
    image: 'https://images.unsplash.com/photo-1497636577773-f1231844b336',
    preparationTime: 6,
    availability: true,
    isAvailable: true,
  },
  {
    name: { en: 'Avocado Juice', am: 'አቮካዶ ጁስ' },
    category: 'drinks',
    price: 80,
    description: { en: 'Fresh avocado smoothie', am: 'አዲስ አቮካዶ ስሞቲ' },
    icon: '🥑',
    image: 'https://images.unsplash.com/photo-1546173159-315724a31696',
    preparationTime: 7,
    availability: true,
    isAvailable: true,
  },
  {
    name: { en: 'Samosa', am: 'ሳሞሳ' },
    category: 'snacks',
    price: 70,
    description: { en: 'Crispy triangular pastry', am: 'ቆርጠው የተጣለ ሳሞሳ' },
    icon: '🥟',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950',
    preparationTime: 9,
    availability: true,
    isAvailable: true,
  },
  {
    name: { en: 'Biscuit', am: 'ቢስኩት' },
    category: 'snacks',
    price: 35,
    description: { en: 'Creamy biscuit snack', am: 'እርሳስ የተሞላ ቢስኩት' },
    icon: '🍪',
    image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35',
    preparationTime: 4,
    availability: true,
    isAvailable: true,
  },
];

const seedUsers = [
  {
    name: 'System Admin',
    fullName: 'System Admin',
    email: 'admin@smartcafeteria.com',
    phone: '0911111111',
    password: 'Admin123!',
    role: 'admin',
    balance: 5000,
    status: 'ACTIVE',
    isActive: true,
  },
  {
    name: 'Kitchen Lead',
    fullName: 'Kitchen Lead',
    email: 'kitchen@smartcafeteria.com',
    phone: '0922222222',
    password: 'Kitchen123!',
    role: 'kitchen',
    balance: 0,
    status: 'ACTIVE',
    isActive: true,
  },
  {
    name: 'Abebe Bekele',
    fullName: 'Abebe Bekele',
    email: 'abebe@smartcafeteria.com',
    phone: '0933333333',
    password: 'Customer123!',
    role: 'customer',
    balance: 1500,
    status: 'ACTIVE',
    isActive: true,
  },
  {
    name: 'Selam Tesfaye',
    fullName: 'Selam Tesfaye',
    email: 'selam@smartcafeteria.com',
    phone: '0944444444',
    password: 'Customer123!',
    role: 'customer',
    balance: 1800,
    status: 'ACTIVE',
    isActive: true,
  },
];

const seedOrders = [
  {
    orderId: 'ET-1001',
    paymentMethod: 'cbe_birr',
    status: 'pending',
    paymentStatus: 'pending',
    orderType: 'dine-in',
    tableNumber: 'A-12',
  },
  {
    orderId: 'ET-1002',
    paymentMethod: 'telebirr',
    status: 'served',
    paymentStatus: 'paid',
    orderType: 'takeaway',
    tableNumber: 'N/A',
  },
];

const seedPayments = [
  {
    method: 'cbe_birr',
    status: 'pending',
    phone: '0911111111',
    reference: 'REF-1001',
  },
  {
    method: 'telebirr',
    status: 'completed',
    phone: '0944444444',
    reference: 'REF-1002',
  },
];

const seedFeedback = [
  {
    rating: 5,
    comment: 'Excellent food and service.',
    category: 'Food Quality',
    dishName: 'Doro Wat',
    status: 'approved',
  },
  {
    rating: 4,
    comment: 'Very good, fast service.',
    category: 'Service',
    dishName: 'Tibs',
    status: 'pending',
  },
];

const seedNotifications = [
  {
    title: 'Welcome',
    message: 'Welcome to Smart Cafeteria. Your account is ready.',
    type: 'system',
    isRead: false,
  },
  {
    title: 'Order Ready',
    message: 'Your order is ready for pickup.',
    type: 'ready',
    isRead: false,
  },
];

const seedCancellations = [
  {
    reason: 'Customer changed mind',
    details: 'Order will be canceled before preparation starts.',
    status: 'pending',
  },
];

async function seedDatabase({ reset = false } = {}) {
  if (reset) {
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      MenuItem.deleteMany({}),
      Order.deleteMany({}),
      Payment.deleteMany({}),
      Notification.deleteMany({}),
      Feedback.deleteMany({}),
      Cancellation.deleteMany({}),
    ]);
  }

  const createdCategories = [];
  for (const category of seedCategories) {
    const existing = await Category.findOne({ id: category.id });
    if (existing) {
      createdCategories.push(existing);
    } else {
      createdCategories.push(await Category.create(category));
    }
  }

  const categoryMap = new Map(createdCategories.map((cat) => [cat.id, cat]));

  const createdMenuItems = [];
  for (const item of seedMenuItems) {
    const normalizedItem = {
      ...item,
      category: item.category,
      isAvailable: item.isAvailable ?? true,
      availability: item.availability ?? true,
    };

    const existing = await MenuItem.findOne({
      'name.en': normalizedItem.name.en,
    });

    if (existing) {
      createdMenuItems.push(existing);
    } else {
      createdMenuItems.push(await MenuItem.create(normalizedItem));
    }
  }

  const createdUsers = [];
  for (const user of seedUsers) {
    const existing = await User.findOne({ email: user.email });
    if (existing) {
      createdUsers.push(existing);
    } else {
      createdUsers.push(await User.create(user));
    }
  }

  const customer = createdUsers.find((user) => user.role === 'customer') || createdUsers[0];
  const admin = createdUsers.find((user) => user.role === 'admin') || createdUsers[0];
  const kitchen = createdUsers.find((user) => user.role === 'kitchen') || createdUsers[0];

  const orderDocs = [];
  for (let i = 0; i < seedOrders.length; i += 1) {
    const seedOrder = seedOrders[i];
    const orderUser = i === 0 ? customer : customer;
    const orderItems = createdMenuItems.slice(0, 2).map((item, idx) => ({
      itemId: item._id,
      name: item.name.en,
      quantity: idx === 0 ? 1 : 2,
      price: item.price,
      notes: idx === 0 ? 'No spicy' : '',
    }));

    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const serviceFee = 20;
    const totalAmount = subtotal + serviceFee;

    const existingOrder = await Order.findOne({ orderId: seedOrder.orderId });
    if (existingOrder) {
      orderDocs.push(existingOrder);
    } else {
      orderDocs.push(
        await Order.create({
          ...seedOrder,
          userId: orderUser._id,
          customerName: orderUser.name || orderUser.fullName,
          customerPhone: orderUser.phone,
          items: orderItems,
          subtotal,
          serviceFee,
          totalAmount,
        }),
      );
    }
  }

  const paymentSeed = seedPayments.map((payment, index) => ({
    ...payment,
    orderId: orderDocs[index]._id,
    userId: customer._id,
    amount: orderDocs[index].totalAmount,
  }));

  const createdPayments = [];
  for (const payment of paymentSeed) {
    const existingPayment = await Payment.findOne({ reference: payment.reference });
    if (existingPayment) {
      createdPayments.push(existingPayment);
    } else {
      createdPayments.push(await Payment.create(payment));
    }
  }

  const createdNotifications = [];
  for (const notification of seedNotifications) {
    const payload = {
      ...notification,
      userId: admin._id,
    };
    const existing = await Notification.findOne({ title: notification.title, userId: admin._id });
    if (existing) {
      createdNotifications.push(existing);
    } else {
      createdNotifications.push(await Notification.create(payload));
    }
  }

  const createdFeedback = [];
  for (let i = 0; i < seedFeedback.length; i += 1) {
    const item = seedFeedback[i];
    const existing = await Feedback.findOne({
      userId: customer._id,
      orderId: orderDocs[i % orderDocs.length]._id,
    });
    if (existing) {
      createdFeedback.push(existing);
    } else {
      createdFeedback.push(
        await Feedback.create({
          ...item,
          userId: customer._id,
          orderId: orderDocs[i % orderDocs.length]._id,
        }),
      );
    }
  }

  const createdCancellations = [];
  for (const cancellation of seedCancellations) {
    const existing = await Cancellation.findOne({ reason: cancellation.reason });
    if (existing) {
      createdCancellations.push(existing);
    } else {
      createdCancellations.push(
        await Cancellation.create({
          ...cancellation,
          orderId: orderDocs[0]._id,
          userId: customer._id,
        }),
      );
    }
  }

  return {
    categories: createdCategories.length,
    menuItems: createdMenuItems.length,
    users: createdUsers.length,
    orders: orderDocs.length,
    payments: createdPayments.length,
    notifications: createdNotifications.length,
    feedback: createdFeedback.length,
    cancellations: createdCancellations.length,
    admin,
    kitchen,
    customer,
  };
}

if (require.main === module) {
  const { connectDatabase } = require('./../config/database');
  connectDatabase()
    .then(async () => {
      const result = await seedDatabase({ reset: true });
      console.log('Database seed completed successfully');
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database seed failed:', error);
      process.exit(1);
    });
}

module.exports = {
  seedCategories,
  seedMenuItems,
  seedUsers,
  seedOrders,
  seedPayments,
  seedFeedback,
  seedNotifications,
  seedCancellations,
  seedDatabase,
};
