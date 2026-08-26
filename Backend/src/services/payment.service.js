import { updateOrderStatus } from './order.service.js';
import { ORDER_STATUS } from '../utils/constants.js';

const payments = [];

export const processPayment = async (orderId, amount, paymentMethod) => {
    if (!orderId || amount <= 0) {
        throw { status: 400, message: 'Invalid payment parameters' };
    }

    const transaction = {
        transactionId: `TXN-${Date.now()}`,
        orderId,
        amount,
        paymentMethod, // e.g., 'telebirr', 'card', 'cash'
        status: 'SUCCESS',
        timestamp: new Date()
    };

    payments.push(transaction);

    // Update corresponding order status
    await updateOrderStatus(orderId, ORDER_STATUS.PENDING);

    return transaction;
};

export const getPaymentDetails = async (transactionId) => {
    const payment = payments.find(p => p.transactionId === transactionId);
    if (!payment) {
        throw { status: 404, message: 'Payment record not found' };
    }
    return payment;
};
