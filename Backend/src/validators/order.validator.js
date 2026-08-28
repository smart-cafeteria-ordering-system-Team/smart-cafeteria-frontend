const { HTTP_STATUS } = require('../config/constants');
const {
    validateObjectId,
    validateOrderStatus,
    validateQuantity,
    validateEnum
} = require('./common.validator');

const validateCreateOrder = (data) => {
    const errors = {};

    if (!Array.isArray(data.items) || data.items.length === 0) {
        errors.items = 'Cart cannot be empty';
    } else {
        data.items.forEach((item, index) => {
            if (!item.itemId || String(item.itemId).trim() === '') {
                errors[`items.${index}.itemId`] = 'Menu item ID is required';
            }
            const quantity = Number(item.quantity);
            if (!Number.isInteger(quantity) || quantity < 1) {
                errors[`items.${index}.quantity`] = 'Quantity must be a positive integer';
            }
        });
    }

    const nameErr = validateName(data.customerName, 'Customer name', 2, 100);
    if (nameErr) errors.customerName = nameErr;

    const phoneErr = validatePhone(data.customerPhone);
    if (phoneErr) errors.customerPhone = phoneErr;

    if (data.orderType) {
        const typeErr = validateEnum(data.orderType, ['dine-in', 'takeaway'], 'Order type');
        if (typeErr) errors.orderType = typeErr;
    }

    if (data.tableNumber !== undefined) {
        if (typeof data.tableNumber !== 'string' && typeof data.tableNumber !== 'number') {
            errors.tableNumber = 'Table number must be a string or number';
        }
    }

    const methodErr = validateEnum(data.paymentMethod, ['CHAPA', 'TELEBIRR'], 'Payment method');
    if (methodErr) errors.paymentMethod = methodErr;

    if (data.totalAmount !== undefined) {
        const amount = Number(data.totalAmount);
        if (!Number.isFinite(amount) || amount < 0) {
            errors.totalAmount = 'Total amount must be a positive number';
        }
    }

    return { isValid: Object.keys(errors).length === 0, errors };
};

const validateUpdateOrderStatus = (data) => {
    const errors = {};
    const statusErr = validateOrderStatus(data.status);
    if (statusErr) errors.status = statusErr;
    return { isValid: Object.keys(errors).length === 0, errors };
};

const validateCancelOrder = (data) => {
    const errors = {};
    if (data.reason && typeof data.reason !== 'string') {
        errors.reason = 'Reason must be a string';
    }
    if (data.adminNote && typeof data.adminNote !== 'string') {
        errors.adminNote = 'Admin note must be a string';
    }
    return { isValid: Object.keys(errors).length === 0, errors };
};

module.exports = {
    validateCreateOrder,
    validateUpdateOrderStatus,
    validateCancelOrder
};