// utils/helpers.js

// Generates a readable reference ID.
// Do NOT use for security-sensitive tokens.
export const generateReferenceId = (prefix = 'REF') => {
    const randomPart = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

    return `${prefix}-${Date.now()}-${randomPart}`;
};


// Calculates an order total from trusted item prices.
export const calculateOrderTotal = (items = []) => {
    if (!Array.isArray(items)) {
        throw new Error('Items must be an array');
    }

    return items.reduce((sum, item) => {
        const price = Number(item.price);
        const quantity = Number(item.quantity);

        if (!Number.isFinite(price) || price < 0) {
            throw new Error('Invalid item price');
        }

        if (!Number.isInteger(quantity) || quantity < 1) {
            throw new Error('Invalid item quantity');
        }

        return sum + (price * quantity);
    }, 0);
};


// Delays execution.
// Mainly useful for tests or mock operations.
export const sleep = (ms = 500) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};