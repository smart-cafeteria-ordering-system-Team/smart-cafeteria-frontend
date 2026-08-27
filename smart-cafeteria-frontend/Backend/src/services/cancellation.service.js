import Order from '../models/Order.js';
import { ORDER_STATUS } from '../utils/constants.js';

export const requestCancellation = async (
    orderId,
    userId,
    reason
) => {
    const order = await Order.findById(orderId);

    if (!order) {
        const error = new Error('Order not found');
        error.statusCode = 404;
        throw error;
    }

    // Make sure this customer owns the order
    if (order.customerId.toString() !== userId.toString()) {
        const error = new Error(
            'You do not have permission to cancel this order'
        );
        error.statusCode = 403;
        throw error;
    }

    // Prevent cancellation after the allowed stage
    if (
        order.status === ORDER_STATUS.READY ||
        order.status === ORDER_STATUS.COMPLETED
    ) {
        const error = new Error(
            'Cannot cancel order once it is ready or completed'
        );
        error.statusCode = 400;
        throw error;
    }

    if (order.status === ORDER_STATUS.CANCELLED) {
        const error = new Error('Order is already cancelled');
        error.statusCode = 400;
        throw error;
    }

    order.status = ORDER_STATUS.CANCELLED;

    // Store cancellation information on the order
    order.cancellation = {
        reason: reason?.trim(),
        requestedAt: new Date()
    };

    await order.save();

    return {
        orderId: order._id,
        status: order.status,
        cancellation: order.cancellation
    };
};