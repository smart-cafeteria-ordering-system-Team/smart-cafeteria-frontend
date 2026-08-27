import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Menu from '../models/Menu.js';
import { ORDER_STATUS } from '../utils/constants.js';
import { generateOrderId } from '../utils/formatters.js';

export const createOrder = async (userId) => {
    const cart = await Cart.findOne({ userId });

    if (!cart || cart.items.length === 0) {
        const error = new Error('Cart is empty');
        error.statusCode = 400;
        throw error;
    }

    const orderItems = [];
    let totalAmount = 0;

    for (const cartItem of cart.items) {
        const menuItem = await Menu.findById(
            cartItem.menuItemId
        );

        if (!menuItem) {
            const error = new Error(
                'One or more menu items no longer exist'
            );
            error.statusCode = 400;
            throw error;
        }

        if (!menuItem.isAvailable) {
            const error = new Error(
                `${menuItem.name} is currently unavailable`
            );
            error.statusCode = 400;
            throw error;
        }

        const subtotal =
            menuItem.price * cartItem.quantity;

        orderItems.push({
            menuItemId: menuItem._id,
            name: menuItem.name,
            price: menuItem.price,
            quantity: cartItem.quantity,
            subtotal
        });

        totalAmount += subtotal;
    }

    const order = await Order.create({
        orderNumber: generateOrderId(),
        userId,
        items: orderItems,
        totalAmount,
        status: ORDER_STATUS.PENDING
    });

    cart.items = [];
    await cart.save();

    return order;
};