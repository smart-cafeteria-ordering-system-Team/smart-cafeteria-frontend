import Menu from '../models/Menu.js';

export const getAllMenuItems = async (filters = {}) => {
    const query = {};

    if (filters.category) {
        query.category = {
            $regex: `^${filters.category.trim()}$`,
            $options: 'i'
        };
    }

    if (filters.availableOnly === true) {
        query.isAvailable = true;
    }

    return await Menu.find(query)
        .sort({ createdAt: -1 });
};


export const createMenuItem = async (itemData) => {
    const existingItem = await Menu.findOne({
        name: itemData.name.trim()
    });

    if (existingItem) {
        const error = new Error(
            'A menu item with this name already exists'
        );
        error.statusCode = 409;
        throw error;
    }

    const menuItem = await Menu.create({
        name: itemData.name.trim(),
        category: itemData.category.trim(),
        price: itemData.price,
        isAvailable: itemData.isAvailable ?? true
    });

    return menuItem;
};


export const updateItemAvailability = async (
    itemId,
    isAvailable
) => {
    const item = await Menu.findById(itemId);

    if (!item) {
        const error = new Error('Menu item not found');
        error.statusCode = 404;
        throw error;
    }

    item.isAvailable = isAvailable;

    await item.save();

    return item;
};