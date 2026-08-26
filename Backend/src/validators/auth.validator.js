export const validateRegisterInput = (data) => {
    const errors = {};
    
    if (!data.email || !data.email.includes('@')) {
        errors.email = 'A valid email address is required';
    }
    if (!data.password || data.password.length < 6) {
        errors.password = 'Password must be at least 6 characters long';
    }
    if (!data.fullName || data.fullName.trim() === '') {
        errors.fullName = 'Full name is required';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};