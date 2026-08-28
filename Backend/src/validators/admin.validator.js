const { HTTP_STATUS } = require('../config/constants');
const {
    validateRole,
    validateName,
    validateEmail,
    validatePhone,
    validatePassword,
    validateObjectId,
    validateBoolean,
    validateEnum,
    validateQuantity,
    validateCategory
} = require('./common.validator');

const validateCreateUser = (data) => {
    const errors = {};

    const nameErr = validateName(data.name, 'Name');
    if (nameErr) errors.name = nameErr;

    const emailErr = validateEmail(data.email);
    if (emailErr) errors.email = emailErr;

    const phoneErr = validatePhone(data.phone);
    if (phoneErr) errors.phone = phoneErr;

    const roleErr = validateRole(data.role);
    if (roleErr) errors.role = roleErr;

    const passErr = validatePassword(data.password, 6);
    if (passErr) errors.password = passErr;

    if (data.balance !== undefined) {
        const balance = Number(data.balance);
        if (!Number.isFinite(balance) || balance < 0) {
            errors.balance = 'Balance must be a non-negative number';
        }
    }

    return { isValid: Object.keys(errors).length === 0, errors };
};

const validateUpdateUser = (data) => {
    const errors = {};

    if (data.name !== undefined) {
        const nameErr = validateName(data.name, 'Name');
        if (nameErr) errors.name = nameErr;
    }

    if (data.email !== undefined) {
        const emailErr = validateEmail(data.email);
        if (emailErr) errors.email = emailErr;
    }

    if (data.phone !== undefined) {
        const phoneErr = validatePhone(data.phone);
        if (phoneErr) errors.phone = phoneErr;
    }

    if (data.role !== undefined) {
        const roleErr = validateRole(data.role);
        if (roleErr) errors.role = roleErr;
    }

    if (data.balance !== undefined) {
        const balance = Number(data.balance);
        if (!Number.isFinite(balance) || balance < 0) {
            errors.balance = 'Balance must be a non-negative number';
        }
    }

    if (data.password !== undefined && data.password !== '') {
        const passErr = validatePassword(data.password, 6);
        if (passErr) errors.password = passErr;
    }

    return { isValid: Object.keys(errors).length === 0, errors };
};

const validateAssignRole = (data) => {
    const errors = {};
    const roleErr = validateRole(data.role);
    if (roleErr) errors.role = roleErr;
    return { isValid: Object.keys(errors).length === 0, errors };
};

const validateToggleStatus = (data) => {
    const errors = {};
    const statusErr = validateEnum(data.status, ['ACTIVE', 'BLOCKED'], 'Status');
    if (statusErr) errors.status = statusErr;
    return { isValid: Object.keys(errors).length === 0, errors };
};

const validateCreateMenuItem = (data) => {
    const errors = {};

    const name = data.name?.trim();
    if (!name) {
        errors.name = 'Menu item name is required';
    } else if (name.length > 100) {
        errors.name = 'Menu item name cannot exceed 100 characters';
    }

    const categoryErr = validateCategory(data.category);
    if (categoryErr) errors.category = categoryErr;

    const priceErr = validatePrice(data.price);
    if (priceErr) errors.price = priceErr;

    if (data.preparationTime !== undefined) {
        const prepErr = validateQuantity(data.preparationTime, 'Preparation time', 1, 120);
        if (prepErr) errors.preparationTime = prepErr;
    }

    if (data.available !== undefined) {
        const boolErr = validateBoolean(data.available, 'Available');
        if (boolErr) errors.available = boolErr;
    }

    return { isValid: Object.keys(errors).length === 0, errors };
};

const validateUpdateMenuItem = (data) => {
    const errors = {};

    if (data.name !== undefined) {
        const name = data.name?.trim();
        if (!name) errors.name = 'English name cannot be empty';
        else if (name.length > 100) errors.name = 'Menu item name cannot exceed 100 characters';
    }

    if (data.category !== undefined) {
        const catErr = validateCategory(data.category);
        if (catErr) errors.category = catErr;
    }

    if (data.price !== undefined) {
        const priceErr = validatePrice(data.price);
        if (priceErr) errors.price = priceErr;
    }

    if (data.preparationTime !== undefined) {
        const prepErr = validateQuantity(data.preparationTime, 'Preparation time', 1, 120);
        if (prepErr) errors.preparationTime = prepErr;
    }

    if (data.available !== undefined) {
        const boolErr = validateBoolean(data.available, 'Available');
        if (boolErr) errors.available = boolErr;
    }

    return { isValid: Object.keys(errors).length === 0, errors };
};

const validateToggleAvailability = (data) => {
    const errors = {};
    const boolErr = validateBoolean(data.available, 'Available');
    if (boolErr) errors.available = boolErr;
    return { isValid: Object.keys(errors).length === 0, errors };
};

module.exports = {
    validateCreateUser,
    validateUpdateUser,
    validateAssignRole,
    validateToggleStatus,
    validateCreateMenuItem,
    validateUpdateMenuItem,
    validateToggleAvailability
};