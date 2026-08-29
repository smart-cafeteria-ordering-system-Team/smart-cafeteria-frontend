// validators/user.validator.js

const validateUpdateProfileInput = (data) => {
    const errors = {};

    // Full name
    if (data.fullName !== undefined) {
        if (typeof data.fullName !== 'string') {
            errors.fullName = 'Full name must be a string';
        } else {
            const fullName = data.fullName.trim();

            if (!fullName) {
                errors.fullName = 'Full name cannot be empty';
            } else if (fullName.length > 100) {
                errors.fullName =
                    'Full name cannot exceed 100 characters';
            }
        }
    }

    // Email
    if (data.email !== undefined) {
        if (typeof data.email !== 'string') {
            errors.email = 'Email must be a string';
        } else {
            const email = data.email.trim();

            const emailPattern =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailPattern.test(email)) {
                errors.email = 'Please provide a valid email address';
            }
        }
    }

    // Phone
    if (data.phone !== undefined) {
        if (typeof data.phone !== 'string') {
            errors.phone = 'Phone number must be a string';
        } else {
            const phone = data.phone.trim();

            if (!/^\+?[0-9\s-]{10,15}$/.test(phone)) {
                errors.phone =
                    'Please provide a valid phone number';
            }
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};
module.exports = { validateUpdateProfileInput };
