// Generates a random alphanumeric reference token
export const generateReferenceId = (prefix = 'REF') => {
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${Date.now()}-${randomHex}`;
};

// Calculates total price for order item arrays
export const calculateOrderTotal = (items = []) => {
    return items.reduce((sum, item) => {
        const itemPrice = Number(item.price) || 0;
        const itemQuantity = Number(item.quantity) || 1;
        return sum + (itemPrice * itemQuantity);
    }, 0);
};

// Delays execution for async/mock operations
export const sleep = (ms = 500) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};