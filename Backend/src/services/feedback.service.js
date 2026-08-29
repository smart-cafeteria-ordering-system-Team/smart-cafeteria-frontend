const Feedback = require("../models/Feedback");
const Order = require("../models/Order");
const { ORDER_STATUS } = require("../utils/constants");

const submitFeedback = async (
    userId,
    orderId,
    rating,
    comment
) => {
    // Validate rating
    if (
        !Number.isInteger(rating) ||
        rating < 1 ||
        rating > 5
    ) {
        const error = new Error(
            'Rating must be between 1 and 5'
        );
        error.statusCode = 400;
        throw error;
    }

    // Find order
    const order = await Order.findById(orderId);

    if (!order) {
        const error = new Error('Order not found');
        error.statusCode = 404;
        throw error;
    }

    // Check ownership
    if (order.customerId.toString() !== userId.toString()) {
        const error = new Error(
            'You do not have permission to review this order'
        );
        error.statusCode = 403;
        throw error;
    }

    // Only completed orders can receive feedback
    if (order.status !== ORDER_STATUS.COMPLETED) {
        const error = new Error(
            'Feedback can only be submitted for completed orders'
        );
        error.statusCode = 400;
        throw error;
    }

    // Prevent duplicate feedback
    const existingFeedback = await Feedback.findOne({
        userId,
        orderId
    });

    if (existingFeedback) {
        const error = new Error(
            'Feedback has already been submitted for this order'
        );
        error.statusCode = 409;
        throw error;
    }

    // Create feedback
    const feedback = await Feedback.create({
        userId,
        orderId,
        rating,
        comment: comment?.trim() || ''
    });

    return feedback;
};


const getOrderFeedback = async (orderId) => {
    return await Feedback.findOne({ orderId });
};
module.exports = { submitFeedback, getOrderFeedback };
