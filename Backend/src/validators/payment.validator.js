export const validatePaymentInput = (data) => {
    const errors = {};

    if (!data.orderId || data.orderId.trim() === '') {
        errors.orderId = 'Order ID is required for payment';
    }

    if (!data.amount || isNaN(data.amount) || Number(data.amount) <= 0) {
        errors.amount = 'Valid payment amount is required';
    }

    const validMethods = ['telebirr', 'card', 'cash', 'cbe_birr'];
    if (!data.paymentMethod || !validMethods.includes(data.paymentMethod.toLowerCase())) {
        errors.paymentMethod = 'Invalid or unsupported payment method';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};