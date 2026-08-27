// validators/payment.validator.js

export const validatePaymentInput = (data) => {
    const errors = {};

    // Order ID
    const orderId = data.orderId?.trim();

    if (!orderId) {
        errors.orderId = 'Order ID is required for payment';
    }

    // Payment method
    const paymentMethod = data.paymentMethod?.trim().toLowerCase();

    const validMethods = [
        'telebirr',
        'cbe_birr',
        'cash'
    ];

    if (!paymentMethod) {
        errors.paymentMethod = 'Payment method is required';
    } else if (!validMethods.includes(paymentMethod)) {
        errors.paymentMethod =
            'Invalid or unsupported payment method';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};