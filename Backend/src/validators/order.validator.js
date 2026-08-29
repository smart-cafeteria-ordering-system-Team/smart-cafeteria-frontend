// validators/order.validator.js

const validateOrderInput = (data) => {
    const errors = {};

    // Items
    if (
        !Array.isArray(data.items) ||
        data.items.length === 0
    ) {
        errors.items = 'Cart cannot be empty';
    } else {
        data.items.forEach((item, index) => {
            if (!item.itemId || String(item.itemId).trim() === '') {
                errors[`items.${index}.itemId`] =
                    'Menu item ID is required';
            }

            const quantity = Number(item.quantity);

            if (
                !Number.isInteger(quantity) ||
                quantity < 1
            ) {
                errors[`items.${index}.quantity`] =
                    'Quantity must be a positive integer';
            }
        });
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};
module.exports = { validateOrderInput };
