import { ORDER_STATUS } from '../utils/constants.js';
import { updateOrderStatus } from './order.service.js';

export const getKitchenQueue = async (ordersList) => {
    // Filter active orders that need kitchen preparation
    return ordersList.filter(order => 
        order.status === ORDER_STATUS.PENDING || order.status === ORDER_STATUS.PREPARING
    );
};

export const markOrderPreparing = async (orderId) => {
    return await updateOrderStatus(orderId, ORDER_STATUS.PREPARING);
};

export const markOrderReady = async (orderId) => {
    return await updateOrderStatus(orderId, ORDER_STATUS.READY);
};