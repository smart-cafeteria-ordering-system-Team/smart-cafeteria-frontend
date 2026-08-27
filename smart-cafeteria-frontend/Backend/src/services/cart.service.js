import Cart from '../models/Cart.js';
import Menu from '../models/Menu.js';

export const getCart = async (userId) => {
    const cart = await Cart.findOne({ userId })
        .populate('items.menuItemId');

    if (!cart) {
        return {
            userId,
            items: []
        };
    }

    return cart;
};


export const addToCart = async (userId, itemId, quantity = 1) => {
    const menuItem = await Menu.findById(itemId);

    if (!menuItem) {
        const error = new Error('Menu item not found');
        error.statusCode = 404;
        throw error;
    }

    if (!menuItem.isAvailable) {
        const error = new Error('Menu item is currently unavailable');
        error.statusCode = 400;
        throw error;
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
        const error = new Error('Quantity must be a positive integer');
        error.statusCode = 400;
        throw error;
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
        cart = new Cart({
            userId,
            items: []
        });
    }

    const existingItem = cart.items.find(
        item => item.menuItemId.toString() === itemId.toString()
    );

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.items.push({
            menuItemId: menuItem._id,
            name: menuItem.name,
            price: menuItem.price,
            quantity
        });
    }

    await cart.save();

    return cart;
};


export const clearCart = async (userId) => {
    await Cart.findOneAndUpdate(
        { userId },
        { $set: { items: [] } }
    );

    return true;
};