// Formats price values cleanly
export const formatCurrency = (amount) => {
    return `${Number(amount).toFixed(2)} ETB`;
};

// Generates readable order tracking IDs
export const generateOrderId = () => {
    return `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
};