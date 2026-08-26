export const seedCategories = [
    { id: 'cat_1', name: 'Breakfast' },
    { id: 'cat_2', name: 'Lunch' },
    { id: 'cat_3', name: 'Drinks' }
];

export const seedMenuItems = [
    {
        id: 'item_101',
        name: 'Special Doro Wat',
        category: 'Lunch',
        price: 250,
        isAvailable: true
    },
    {
        id: 'item_102',
        name: 'Shiro Tagino',
        category: 'Lunch',
        price: 120,
        isAvailable: true
    },
    {
        id: 'item_103',
        name: 'Spris Juice',
        category: 'Drinks',
        price: 60,
        isAvailable: true
    }
];

export const seedUsers = [
    {
        id: 'usr_admin',
        fullName: 'Admin User',
        email: 'admin@cafeteria.com',
        role: 'admin'
    },
    {
        id: 'usr_kitchen',
        fullName: 'Kitchen Staff',
        email: 'kitchen@cafeteria.com',
        role: 'kitchen'
    }
];