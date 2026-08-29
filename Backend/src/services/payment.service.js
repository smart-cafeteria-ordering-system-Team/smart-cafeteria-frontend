const Payment = require("../models/Payment");
const Order = require("../models/Order");

const processPayment = async (
    orderId,
    userId,
    paymentMethod
) => {
    const order = await Order.findOne({
        _id: orderId,
        userId
    });

    if (!order) {
        const error = new Error('Order not found');
        error.statusCode = 404;
        throw error;
    }

    if (order.status === 'CANCELLED') {
        const error = new Error(
            'Cannot pay for a cancelled order'
        );
        error.statusCode = 400;
        throw error;
    }

    const existingPayment = await Payment.findOne({
        orderId: order._id,
        status: 'SUCCESS'
    });

    if (existingPayment) {
        const error = new Error(
            'Order has already been paid'
        );
        error.statusCode = 400;
        throw error;
    }

    const allowedMethods = [
        'telebirr',
        'cbe'
    ];

    if (!allowedMethods.includes(paymentMethod)) {
        const error = new Error(
            'Invalid payment method'
        );
        error.statusCode = 400;
        throw error;
    }

    const transaction = await Payment.create({
        orderId: order._id,
        userId: order.userId,
        amount: order.totalAmount,
        paymentMethod,
        status: 'SUCCESS',
        isSimulation: true
    });

    return transaction;
};
module.exports = { processPayment };
