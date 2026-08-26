// Sample backend data store
const menuItems = [
    { id: 'item_1', name: 'Special Doro Wat', category: 'Lunch', price: 250, isAvailable: true },
    { id: 'item_2', name: 'Shiro Tagino', category: 'Lunch', price: 120, isAvailable: true }
];

export const getAllMenuItems = async (filters = {}) => {
    let result = [...menuItems];

    if (filters.category) {
        result = result.filter(item => item.category.toLowerCase() === filters.category.toLowerCase());
    }
    if (filters.availableOnly) {
        result = result.filter(item => item.isAvailable === true);
    }

    return result;
};

export const createMenuItem = async (itemData) => {
    const newItem = {
        id: `item_${Date.now()}`,
        name: itemData.name,
        category: itemData.category,
        price: itemData.price,
        isAvailable: itemData.isAvailable ?? true,
        createdAt: new Date()
    };

    menuItems.push(newItem);
    return newItem;
};

export const updateItemAvailability = async (itemId, isAvailable) => {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) {
        throw { status: 404, message: 'Menu item not found' };
    }

    item.isAvailable = isAvailable;
    return item;
};