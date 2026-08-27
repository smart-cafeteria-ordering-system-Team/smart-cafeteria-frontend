import Order from '../models/Order.js';
import { ORDER_STATUS } from '../utils/constants.js';
import { updateOrderStatus } from './order.service.js';

export const getKitchenQueue = async () => {
    return await Order.find({
        status: {
            $in: [
                ORDER_STATUS.PENDING,
                ORDER_STATUS.PREPARING
            ]
        }
    }).sort({ createdAt: 1 });
};

export const markOrderPreparing = async (orderId) => {
    return await updateOrderStatus(
        orderId,
        ORDER_STATUS.PREPARING
    );
};

export const markOrderReady = async (orderId) => {
    return await updateOrderStatus(
        orderId,
        ORDER_STATUS.READY
    );
};