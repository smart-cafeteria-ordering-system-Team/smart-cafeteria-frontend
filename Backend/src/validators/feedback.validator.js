export const validateFeedbackInput = (data) => {
    const errors = {};

    if (!data.orderId || data.orderId.trim() === '') {
        errors.orderId = 'Order ID is required to leave feedback';
    }

    if (data.rating === undefined || isNaN(data.rating) || data.rating < 1 || data.rating > 5) {
        errors.rating = 'Rating must be an integer between 1 and 5';
    }

    if (data.comment && data.comment.length > 500) {
        errors.comment = 'Comment cannot exceed 500 characters';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};