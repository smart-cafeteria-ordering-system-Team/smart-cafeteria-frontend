const { ORDER_STATUS, PAYMENT_STATUS } = require('../config/constants');

const VALID_ROLES = ['customer', 'kitchen', 'admin', 'STUDENT', 'STAFF', 'ADMIN', 'KITCHEN_STAFF'];

const VALID_ORDER_STATUSES = [
    'PENDING', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED',
    'pending', 'preparing', 'ready', 'served', 'completed', 'cancelled'
];

const VALID_PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED', 'CANCELLED'];

const isValidObjectId = (id) => {
    if (!id || typeof id !== 'string') return false;
    return /^[0-9a-fA-F]{24}$/.test(id);
};

const isValidDate = (date) => {
    if (!date) return false;
    const d = new Date(date);
    return d instanceof Date && !isNaN(d.getTime());
};

const validateRole = (role) => {
    if (!role) return 'Role is required';
    if (!VALID_ROLES.includes(role)) {
        return `Invalid role. Allowed: ${VALID_ROLES.join(', ')}`;
    }
    return null;
};

const validateOrderStatus = (status) => {
    if (!status) return 'Status is required';
    if (!VALID_ORDER_STATUSES.includes(status)) {
        return `Invalid order status. Allowed: ${VALID_ORDER_STATUSES.join(', ')}`;
    }
    return null;
};

const validatePaymentStatus = (status) => {
    if (!status) return 'Payment status is required';
    if (!VALID_PAYMENT_STATUSES.includes(status)) {
        return `Invalid payment status. Allowed: ${VALID_PAYMENT_STATUSES.join(', ')}`;
    }
    return null;
};

const validateObjectId = (id, fieldName = 'ID') => {
    if (!id) return `${fieldName} is required`;
    if (!isValidObjectId(id)) return `Invalid ${fieldName} format`;
    return null;
};

const validateDate = (date, fieldName = 'Date') => {
    if (!date) return `${fieldName} is required`;
    if (!isValidDate(date)) return `Invalid ${fieldName} format (use ISO 8601)`;
    return null;
};

const validateDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return 'Both start and end dates are required';
    if (!isValidDate(startDate)) return 'Invalid start date format';
    if (!isValidDate(endDate)) return 'Invalid end date format';
    if (new Date(startDate) > new Date(endDate)) return 'Start date must be before end date';
    return null;
};

const validateEmail = (email) => {
    if (!email) return 'Email is required';
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) return 'Invalid email format';
    return null;
};

const validatePassword = (password, minLength = 6) => {
    if (!password) return 'Password is required';
    if (password.length < minLength) return `Password must be at least ${minLength} characters`;
    return null;
};

const validateName = (name, fieldName = 'Name', min = 2, max = 100) => {
    if (!name) return `${fieldName} is required`;
    const trimmed = name.trim();
    if (trimmed.length < min) return `${fieldName} must be at least ${min} characters`;
    if (trimmed.length > max) return `${fieldName} cannot exceed ${max} characters`;
    return null;
};

const validatePhone = (phone) => {
    if (!phone) return 'Phone number is required';
    if (!/^(\+?[0-9\s-]{10,15})$/.test(phone)) return 'Invalid phone number format';
    return null;
};

const validatePrice = (price) => {
    if (price === undefined || price === null || price === '') return 'Price is required';
    const num = Number(price);
    if (!Number.isFinite(num) || num <= 0) return 'Price must be a number greater than 0';
    return null;
};

const validateCategory = (category) => {
    if (!category) return 'Category is required';
    const VALID_CATEGORIES = ['breakfast', 'mains', 'main-meals', 'fasting', 'beverages', 'snacks', 'Lunch', 'Dinner'];
    if (!VALID_CATEGORIES.includes(category)) {
        return `Invalid category. Allowed: ${VALID_CATEGORIES.join(', ')}`;
    }
    return null;
};

const validateQuantity = (quantity, fieldName = 'Quantity', min = 1, max = 100) => {
    if (quantity === undefined || quantity === null || quantity === '') return `${fieldName} is required`;
    const num = Number(quantity);
    if (!Number.isInteger(num) || num < min || num > max) {
        return `${fieldName} must be an integer between ${min} and ${max}`;
    }
    return null;
};

const validateBoolean = (value, fieldName) => {
    if (value === undefined || value === null) return `${fieldName} is required`;
    if (typeof value !== 'boolean') return `${fieldName} must be a boolean`;
    return null;
};

const validateEnum = (value, allowedValues, fieldName) => {
    if (!value) return `${fieldName} is required`;
    if (!allowedValues.includes(value)) {
        return `Invalid ${fieldName}. Allowed: ${allowedValues.join(', ')}`;
    }
    return null;
};

module.exports = {
    validateRole,
    validateOrderStatus,
    validatePaymentStatus,
    validateObjectId,
    validateDate,
    validateDateRange,
    validateEmail,
    validatePassword,
    validateName,
    validatePhone,
    validatePrice,
    validateCategory,
    validateQuantity,
    validateBoolean,
    validateEnum,
    VALID_ROLES,
    VALID_ORDER_STATUSES,
    VALID_PAYMENT_STATUSES,
    isValidObjectId,
    isValidDate
};