/**
 * ================================================================
 * SMART CAFETERIA ORDERING SYSTEM - CONFIGURATION
 * ================================================================
 * All global configuration settings, constants, and mock data.
 * ================================================================
 */

// ===== 1. APP CONFIGURATION =====
export const APP_CONFIG = {
    name: 'Smart Cafeteria Ordering System',
    version: '1.0.0',
    author: 'Kidus Birhanu, Sintayehu Begashaw, Wondesen Gemechu',
    year: 2026,
    institution: 'Debre Berhan University',
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'am'],
};

// ===== 2. API CONFIGURATION (Future Backend) =====
export const API_CONFIG = {
    baseURL: process.env.API_URL || 'https://api.smartcafeteria.com/v1',
    timeout: 30000,
    endpoints: {
        auth: {
            login: '/auth/login',
            register: '/auth/register',
            logout: '/auth/logout',
            profile: '/auth/profile',
        },
        users: {
            list: '/users',
            get: '/users/:id',
            update: '/users/:id',
            delete: '/users/:id',
        },
        menu: {
            list: '/menu',
            categories: '/menu/categories',
            category: '/menu/category/:id',
            item: '/menu/:id',
            create: '/menu',
            update: '/menu/:id',
            delete: '/menu/:id',
        },
        cart: {
            get: '/cart',
            add: '/cart/add',
            update: '/cart/update/:itemId',
            remove: '/cart/remove/:itemId',
            clear: '/cart/clear',
        },
        orders: {
            list: '/orders',
            myOrders: '/orders/myorders',
            get: '/orders/:id',
            create: '/orders',
            updateStatus: '/orders/:id/status',
            markReady: '/orders/:id/ready',
            status: '/orders/:id/status',
        },
        payments: {
            initializeChapa: '/payments/chapa/initialize',
            verifyChapa: '/payments/chapa/verify/:txRef',
            list: '/payments',
            getByOrder: '/payments/order/:orderId',
        },
        notifications: {
            list: '/notifications',
            unread: '/notifications/unread',
            markRead: '/notifications/:id/read',
            delete: '/notifications/:id',
        },
        reports: {
            daily: '/reports/daily',
            sales: '/reports/sales',
            popular: '/reports/popular',
            payments: '/reports/payments',
        },
    },
};

// ===== 3. STORAGE KEYS =====
export const STORAGE_KEYS = {
    user: 'scos_user',
    token: 'scos_token',
    cart: 'scos_cart',
    theme: 'scos_theme',
    language: 'scos_language',
    notifications: 'scos_notifications',
};

// ===== 4. ROLES =====
export const ROLES = {
    CUSTOMER: 'customer',
    KITCHEN: 'kitchen',
    ADMIN: 'admin',
};

// ===== 5. ORDER STATUSES =====
export const ORDER_STATUS = {
    PENDING: 'pending',
    PREPARING: 'preparing',
    READY: 'ready',
    SERVED: 'served',
    CANCELLED: 'cancelled',
};

export const ORDER_STATUS_LABELS = {
    pending: { en: 'Pending', am: 'በመጠበቅ ላይ' },
    preparing: { en: 'Preparing', am: 'በዝግጅት ላይ' },
    ready: { en: 'Ready', am: 'ዝግጁ' },
    served: { en: 'Served', am: 'ተሰርቷል' },
    cancelled: { en: 'Cancelled', am: 'ተሰርዟል' },
};

export const ORDER_STATUS_COLORS = {
    pending: 'warning',
    preparing: 'info',
    ready: 'success',
    served: 'gray',
    cancelled: 'danger',
};

// ===== 6. PAYMENT STATUSES =====
export const PAYMENT_STATUS = {
    PENDING: 'pending',
    SIMULATED: 'simulated',
    FAILED: 'failed',
};

export const PAYMENT_METHODS = {
    TELEBIRR: 'TELEBIRR',
    CHAPA: 'CHAPA',
};

// ===== 7. MENU CATEGORIES =====
export const MENU_CATEGORIES = [
    { id: 'breakfast', name: { en: 'Breakfast', am: 'ቁርስ' }, icon: '🌅' },
{ id: 'main-meals', name: { en: 'Main Meals', am: 'ዋና ምግቦች' }, icon: '🍛' },
    { id: 'fasting', name: { en: 'Fasting Meals', am: 'የጾም ምግቦች' }, icon: '🥗' },
    { id: 'beverages', name: { en: 'Beverages', am: 'መጠጦች' }, icon: '🥤' },
    { id: 'snacks', name: { en: 'Snacks', am: 'ቀላል ምግቦች' }, icon: '🍿' },
];

// ===== 8. MOCK MENU ITEMS (24 items) =====
export const MENU_ITEMS = [
    // ===== ቁርስ (Breakfast) - 6 items =====
    {
        id: 1,
        name: { en: "Pasta with Bread", am: "ፓስታ በዳቦ" },
        category: "breakfast",
        price: 75,
        description: {
            en: "Delicious pasta served with fresh bread",
            am: "ጣፋጭ ፓስታ ከትኩስ ዳቦ ጋር",
        },
        icon: "🍝",
        image: "assets/images/food/breakfast/pasta-with-bread.jpg",
        preparationTime: 10,
        availability: true,
    },
    {
        id: 2,
        name: { en: "Pasta with Injera", am: "ፓስታ በእንጀራ" },
        category: "breakfast",
        price: 80,
        description: {
            en: "Pasta served with traditional injera",
            am: "ፓስታ ከባህላዊ እንጀራ ጋር",
        },
        icon: "🍝",
        image: "assets/images/food/breakfast/pasta-with-injera.jpg",
        preparationTime: 10,
        availability: true,
    },
    {
        id: 3,
        name: { en: "Firfir", am: "ፍርፍር" },
        category: "breakfast",
        price: 70,
        description: {
            en: "Spiced torn injera with berbere sauce",
            am: "በርበሬ ወጥ የተጣለ እንጀራ",
        },
        icon: "🍛",
        image: "assets/images/food/breakfast/firfir.jpeg",
        preparationTime: 8,
        availability: true,
    },
    {
        id: 4,
        name: { en: "Egg", am: "እንቁላል" },
        category: "breakfast",
        price: 80,
        description: {
            en: "Fried or boiled egg served with bread",
            am: "የተጠበሰ ወይም የተቀቀለ እንቁላል ከዳቦ ጋር",
        },
        icon: "🍳",
        image: "assets/images/food/breakfast/scrambled-egg.jpeg",
        preparationTime: 5,
        availability: true,
    },
    {
        id: 5,
        name: { en: "Scrambled Egg", am: "እንቁላል ፍርፍር" },
        category: "breakfast",
        price: 90,
        description: {
            en: "Fluffy scrambled eggs with butter",
            am: "ለስላሳ የተፈጨ እንቁላል በቅቤ",
        },
        icon: "🍳",
        image: "assets/images/food/breakfast/scrambled-egg.jpeg",
        preparationTime: 7,
        availability: true,
    },
    {
        id: 6,
        name: { en: "Omelette", am: "እንቁላል ስልስ" },
        category: "breakfast",
        price: 90,
        description: {
            en: "Omelette with vegetables and cheese",
            am: "እንቁላል ስልስ በአትክልት እና አይብ",
        },
        icon: "🍳",
        image: "assets/images/food/breakfast/omelett(Enkulal sils).jpeg",
        preparationTime: 8,
        availability: true,
    },

    // ===== ዋና ምግቦች (Main Meals) - 9 items =====
    {
        id: 7,
        name: { en: "Pasta with Vegetables", am: "ፓስታ በአትክልት" },
        category: "main-meals",
        price: 75,
        description: {
            en: "Pasta with fresh mixed vegetables",
            am: "ፓስታ ከትኩስ አትክልት ጋር",
        },
        icon: "🍝",
        image: "assets/images/food/main-meals/pasta-with-vegetables.jpeg",
        preparationTime: 12,
        availability: true,
    },
    {
        id: 8,
        name: { en: "Shiro Feses", am: "ሽሮ ፈሰስ" },
        category: "main-meals",
        price: 75,
        description: {
            en: "Traditional chickpea stew with spices",
            am: "ባህላዊ ሽሮ በቅመማ ቅመም",
        },
        icon: "🍲",
        image: "assets/images/food/main-meals/shiro-feses.jpg",
        preparationTime: 12,
        availability: true,
    },
    {
        id: 9,
        name: { en: "Tomato Sauce", am: "ቲማቲም ስልስ" },
 category: "main-meals",
        price: 70,
        description: {
            en: "Rich tomato sauce with spices",
            am: "የበለጸገ ቲማቲም ስልስ በቅመማ ቅመም",
        },
        icon: "🍅",
        image: "assets/images/food/main-meals/tomato-sauce.jpeg",
        preparationTime: 10,
        availability: true,
    },
    {
        id: 10,
        name: { en: "Cheese with Butter", am: "አይብ በቅቤ" },
        category: "main-meals",
        price: 100,
        description: {
            en: "Fresh cheese served with butter and bread",
            am: "ትኩስ አይብ ከቅቤ እና ዳቦ ጋር",
        },
        icon: "🧀",
        image: "assets/images/food/main-meals/cheese-with-butter.jpeg",
        preparationTime: 8,
        availability: true,
    },
    {
        id: 11,
        name: { en: "Red Stew", am: "ቀይ ወጥ" },
        category: "main-meals",
        price: 180,
        description: {
            en: "Spicy beef stew with berbere sauce",
            am: "ቅመማ ቅመም የበርበሬ ወጥ",
        },
        icon: "🥘",
        image: "assets/images/food/main-meals/red-stew.jpeg",
        preparationTime: 20,
        availability: true,
    },
    {
        id: 12,
        name: { en: "Grilled Meat", am: "የስጋ ጥብስ" },
        category: "main-meals",
        price: 250,
        description: {
            en: "Grilled meat served with vegetables",
            am: "የተጠበሰ ስጋ ከአትክልት ጋር",
        },
        icon: "🥩",
        image: "assets/images/food/main-meals/grilled-meat.jpeg",
        preparationTime: 25,
        availability: true,
    },
    {
        id: 13,
        name: { en: "Egg with Meat", am: "እንቁላል በስጋ" },
        category: "main-meals",
        price: 180,
        description: { en: "Egg served with meat stew", am: "እንቁላል ከስጋ ወጥ ጋር" },
        icon: "🍳",
        image: "assets/images/food/main-meals/egg-with-meat.jpg",
        preparationTime: 18,
        availability: true,
    },
    {
        id: 14,
        name: { en: "Cabbage with Meat", am: "ጎመን በስጋ" },
        category: "main-meals",
        price: 160,
        description: {
            en: "Cabbage cooked with meat and spices",
            am: "ጎመን ከስጋ እና ቅመም ጋር",
        },
        icon: "🥬",
        image: "assets/images/food/main-meals/cabbage-with-meat.jpeg",
        preparationTime: 18,
        availability: true,
    },
    {
        id: 15,
        name: { en: "Vegetables with Meat", am: "አትክልት በስጋ" },
        category: "main-meals",
        price: 160,
        description: {
            en: "Mixed vegetables cooked with meat",
            am: "የተቀላቀለ አትክልት ከስጋ ጋር",
        },
        icon: "🥗",
        image: "assets/images/food/main-meals/vegetables-with-meat.jpeg",
        preparationTime: 18,
        availability: true,
    },

    // ===== የጾም ምግቦች (Fasting Meals) - 4 items =====
    {
        id: 16,
        name: { en: "Lentil Stew", am: "ምስር ኖርማል" },
        category: "fasting",
        price: 80,
        description: {
            en: "Traditional lentil stew with spices",
            am: "ባህላዊ ምስር ወጥ በቅመማ ቅመም",
        },
        icon: "🍲",
        image: "assets/images/food/fasting/lentil-stew.jpeg",
        preparationTime: 15,
        availability: true,
    },
    {
        id: 17,
        name: { en: "Ful with Bread", am: "ፉል የጾም በዳቦ" },
        category: "fasting",
        price: 80,
        description: { en: "Fasting ful served with bread", am: "የጾም ፉል ከዳቦ ጋር" },
        icon: "🫘",
        image: "assets/images/food/fasting/ful-with-bread.jpg",
        preparationTime: 10,
        availability: true,
    },
    {
        id: 18,
        name: { en: "Fasting Sandwich", am: "የጾም ሳንዱች" },
        category: "fasting",
        price: 50,
        description: {
            en: "Vegetarian sandwich with vegetables",
            am: "የአትክልት ሳንዱች",
        },
 icon: "🥪",
        image: "assets/images/food/fasting/ful with Bread (Fasting).jpg",
        preparationTime: 7,
        availability: true,
    },
    {
        id: 19,
        name: { en: "Mixed Fasting (5 types)", am: "በየዓይነት (5 ዓይነት)" },
        category: "fasting",
        price: 80,
        description: {
            en: "Mixed fasting meal with 5 different items",
            am: "የተለያዩ 5 የጾም ምግቦች",
        },
        icon: "🥗",
        image: "assets/images/food/fasting/mixed-fasting(yetsom Beyaynet).jpeg",
        preparationTime: 15,
        availability: true,
    },

    // ===== መጠጦች (Beverages) - 3 items =====
    {
        id: 20,
        name: { en: "Juice", am: "ጁስ" },
        category: "beverages",
        price: 55,
        description: { en: "Fresh fruit juice", am: "ትኩስ የፍራፍሬ ጭማቂ" },
        icon: "🧃",
        image: "assets/images/food/beverages/juice.jpeg",
        preparationTime: 3,
        availability: true,
    },
    {
        id: 21,
        name: { en: "Water", am: "ውሃ" },
        category: "beverages",
        price: 30,
        description: { en: "Bottled water", am: "የታሸገ ውሃ" },
        icon: "💧",
        image: "assets/images/food/beverages/water.jpeg",
        preparationTime: 1,
        availability: true,
    },
    {
        id: 22,
        name: { en: "Soft Drink", am: "ለስላሳ" },
        category: "beverages",
        price: 70,
        description: { en: "Carbonated soft drink", am: "የካርቦን ለስላሳ መጠጥ" },
        icon: "🥤",
        image: "assets/images/food/beverages/soft-drink.jpeg",
        preparationTime: 1,
        availability: true,
    },

    // ===== ቀላል ምግቦች (Snacks) - 2 items =====
    {
        id: 23,
        name: { en: "Avocado with Injera", am: "አቮካዶ በእንጀራ" },
        category: "snacks",
        price: 85,
        description: {
            en: "Fresh avocado served with injera",
            am: "ትኩስ አቮካዶ ከእንጀራ ጋር",
        },
        icon: "🥑",
        image: "assets/images/food/snacks/avocado-with-injera.jpeg",
        preparationTime: 5,
        availability: true,
    },
    {
        id: 24,
        name: { en: "Meat Sandwich", am: "የስጋ ሳንዱች" },
        category: "snacks",
        price: 100,
        description: {
            en: "Sandwich with grilled meat and vegetables",
            am: "ሳንዱች ከተጠበሰ ስጋ እና አትክልት ጋር",
        },
        icon: "🥪",
        image: "assets/images/food/snacks/meat-sandwich.jpg",
        preparationTime: 8,
        availability: true,
    },
];

// ===== 9. MOCK USERS =====
export const MOCK_USERS = [
    {
        id: 'u1',
        name: 'Kidus Birhanu',
        email: 'kidus@gmail.com',
        password: 'password123',
        role: ROLES.ADMIN,
        phone: '+251 912 345 678',
        avatar: null,
        createdAt: '2026-08-01T00:00:00.000Z',
    },
    {
        id: 'u2',
        name: 'Sintayehu Begashaw',
        email: 'sintayehu@gmail.com',
        password: 'password123',
        role: ROLES.KITCHEN,
        phone: '+251 923 456 789',
        avatar: null,
        createdAt: '2026-08-01T00:00:00.000Z',
    },
    {
        id: 'u3',
        name: 'Wondesen Gemechu',
        email: 'wondesen@gmail.com',
        password: 'password123',
        role: ROLES.CUSTOMER,
        phone: '+251 934 567 890',
        avatar: null,
        createdAt: '2026-08-01T00:00:00.000Z',
    },
    {
        id: 'u4',
        name: 'Abebe Kebede',
        email: 'abebe@gmail.com',
        password: 'password123',
        role: ROLES.CUSTOMER,
        phone: '+251 945 678 901',
        avatar: null,
        createdAt: '2026-08-02T00:00:00.000Z',
    },
    {
        id: 'u5',
        name: 'Tigist Haile',
        email: 'tigist@gmail.com',
        password: 'password123',
        role: ROLES.CUSTOMER,
        phone: '+251 956 789 012',
        avatar: null,
        createdAt: '2026-08-02T00:00:00.000Z',
    },
];
 // ===== 10. MOCK ORDERS =====
export const MOCK_ORDERS = [
    {
        id: 'o1',
        userId: 'u3',
        items: [
            { itemId: 1, name: 'ፓስታ በዳቦ', quantity: 2, price: 75 },
            { itemId: 11, name: 'ቀይ ወጥ', quantity: 1, price: 180 },
        ],
        totalAmount: 330,
        status: 'ready',
        paymentStatus: 'simulated',
        orderTime: new Date(Date.now() - 3600000 * 2).toISOString(),
        readyTime: new Date(Date.now() - 3600000 * 1.5).toISOString(),
        completedTime: null,
    },
    {
        id: 'o2',
        userId: 'u4',
        items: [
            { itemId: 16, name: 'ምስር ኖርማል', quantity: 1, price: 80 },
            { itemId: 20, name: 'ጁስ', quantity: 2, price: 55 },
        ],
        totalAmount: 190,
        status: 'preparing',
        paymentStatus: 'simulated',
        orderTime: new Date(Date.now() - 3600000 * 0.5).toISOString(),
        readyTime: null,
        completedTime: null,
    },
    {
        id: 'o3',
        userId: 'u5',
        items: [
            { itemId: 12, name: 'የስጋ ጥብስ', quantity: 1, price: 250 },
            { itemId: 24, name: 'የስጋ ሳንዱች', quantity: 1, price: 100 },
        ],
        totalAmount: 350,
        status: 'pending',
        paymentStatus: 'pending',
        orderTime: new Date(Date.now() - 3600000 * 0.2).toISOString(),
        readyTime: null,
        completedTime: null,
    },
];

// ===== 11. DEFAULT SETTINGS =====
export const DEFAULT_SETTINGS = {
    language: 'en',
    theme: 'light',
    currency: 'ETB',
    currencySymbol: 'ብር',
    taxRate: 0,
    serviceCharge: 0,
};

// ===== 12. REGEX PATTERNS =====
export const PATTERNS = {
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    phone: /^\+?[0-9]{9,12}$/,
    password: /^.{6,}$/,
    name: /^[a-zA-Z\u1200-\u137F\s]{2,50}$/,
};