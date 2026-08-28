const { validateName, validateEmail, validatePhone, validatePassword } = require('./common.validator');

const validateRegisterInput = (data) => {
    const errors = {};

    const nameErr = validateName(data.fullName, 'Full name', 2, 100);
    if (nameErr) errors.fullName = nameErr;

    const emailErr = validateEmail(data.email);
    if (emailErr) errors.email = emailErr;

    const phoneErr = validatePhone(data.phone);
    if (phoneErr) errors.phone = phoneErr;

    const passErr = validatePassword(data.password, 8);
    if (passErr) errors.password = passErr;

    if (!data.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
    } else if (data.password !== data.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
    }

    return { isValid: Object.keys(errors).length === 0, errors };
};

const validateLoginInput = (data) => {
    const errors = {};

    if (!data.identifier) {
        errors.identifier = 'Email or phone is required';
    }

    if (!data.password) {
        errors.password = 'Password is required';
    }

    return { isValid: Object.keys(errors).length === 0, errors };
};

const validateUpdateProfileInput = (data) => {
    const errors = {};

    if (data.fullName !== undefined) {
        const nameErr = validateName(data.fullName, 'Full name', 2, 100);
        if (nameErr) errors.fullName = nameErr;
    }

    if (data.email !== undefined) {
        const emailErr = validateEmail(data.email);
        if (emailErr) errors.email = emailErr;
    }

    if (data.phone !== undefined) {
        const phoneErr = validatePhone(data.phone);
        if (phoneErr) errors.phone = phoneErr;
    }

    if (data.password !== undefined && data.password !== '') {
        const passErr = validatePassword(data.password, 6);
        if (passErr) errors.password = passErr;
    }

    if (data.currentPassword !== undefined) {
        if (!data.currentPassword) {
            errors.currentPassword = 'Current password is required';
        }
    }

    return { isValid: Object.keys(errors).length === 0, errors };
};

module.exports = {
    validateRegisterInput,
    validateLoginInput,
    validateUpdateProfileInput
};