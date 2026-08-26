import { ORDER_STATUS } from '../utils/constants.js';
import { generateOrderId } from '../utils/formatters.js';
import { validateOrderInput } from '../validators/order.validator.js';

const orders = [];

export const createOrder = async (userId, orderData) => {
    const validation = validateOrderInput(orderData);
    if (!validation.isValid) {
        throw { status: 400, message: 'Invalid order payload', errors: validation.errors };
    }

    const newOrder = {
        orderId: generateOrderId(),
        userId,
        items: orderData.items,
        totalPrice: orderData.totalPrice,
        status: ORDER_STATUS.PENDING,
        createdAt: new Date()
    };

    orders.push(newOrder);
    return newOrder;
};

export const getOrdersByUser = async (userId) => {
    return orders.filter(order => order.userId === userId);
};

export const updateOrderStatus = async (orderId, newStatus) => {
    const validStatuses = Object.values(ORDER_STATUS);
    if (!validStatuses.includes(newStatus)) {
        throw { status: 400, message: 'Invalid status update' };
    }

    const order = orders.find(o => o.orderId === orderId);
    if (!order) {
        throw { status: 404, message: 'Order not found' };
    }

    order.status = newStatus;
    order.updatedAt = new Date();
    return order;
};