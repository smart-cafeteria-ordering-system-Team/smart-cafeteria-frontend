export const validateUpdateProfileInput = (data) => {
    const errors = {};

    if (data.email && (!data.email.includes('@') || !data.email.includes('.'))) {
        errors.email = 'Please provide a valid email address';
    }

    if (data.fullName !== undefined && data.fullName.trim() === '') {
        errors.fullName = 'Full name cannot be empty';
    }

    if (data.phone && data.phone.length < 10) {
        errors.phone = 'Phone number must be at least 10 digits';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};