// validators/feedback.validator.js

export const validateFeedbackInput = (data) => {
    const errors = {};

    // Order ID
    const orderId = data.orderId?.trim();

    if (!orderId) {
        errors.orderId = 'Order ID is required to leave feedback';
    }

    // Rating
    const rating = Number(data.rating);

    if (
        data.rating === undefined ||
        data.rating === null ||
        !Number.isInteger(rating) ||
        rating < 1 ||
        rating > 5
    ) {
        errors.rating = 'Rating must be an integer between 1 and 5';
    }

    // Comment
    const comment = data.comment?.trim() || '';

    if (comment.length > 500) {
        errors.comment = 'Comment cannot exceed 500 characters';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};