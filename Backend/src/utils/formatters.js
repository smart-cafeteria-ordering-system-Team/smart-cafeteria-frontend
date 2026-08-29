// utils/formatters.js

const formatCurrency = (amount) => {
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount)) {
        return '0.00 ETB';
    }

    return `${numericAmount.toFixed(2)} ETB`;
};

const generateOrderId = () => {
    const randomNumber = Math.floor(
        100000 + Math.random() * 900000
    );

    return `ORD-${randomNumber}`;
};
module.exports = { formatCurrency, generateOrderId };
