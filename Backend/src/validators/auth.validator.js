// validators/auth.validator.js

const validateRegisterInput = (data) => {
    const errors = {};

    // Full name
    const fullName = data.fullName?.trim();

    if (!fullName) {
        errors.fullName = 'Full name is required';
    } else if (fullName.length < 2) {
        errors.fullName = 'Full name must be at least 2 characters long';
    }

    // Email
    const email = data.email?.trim();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
        errors.email = 'Email address is required';
    } else if (!emailPattern.test(email)) {
        errors.email = 'A valid email address is required';
    }

    // Phone
    const phone = data.phone?.trim();

    if (!phone) {
        errors.phone = 'Phone number is required';
    }

    // Password
    if (!data.password) {
        errors.password = 'Password is required';
    } else if (data.password.length < 8) {
        errors.password = 'Password must be at least 8 characters long';
    }

    // Confirm password
    if (!data.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
    } else if (data.password !== data.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};
module.exports = { validateRegisterInput };
