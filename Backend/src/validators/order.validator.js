export const validateOrderInput = (data) => {
    const errors = {};

    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
        errors.items = 'Cart cannot be empty';
    }
    if (!data.totalPrice || data.totalPrice <= 0) {
        errors.totalPrice = 'Invalid total order amount';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};