export const validateMenuItemInput = (data) => {
    const errors = {};

    if (!data.name || data.name.trim() === '') {
        errors.name = 'Menu item name is required';
    }

    if (!data.category || data.category.trim() === '') {
        errors.category = 'Category is required';
    }

    if (data.price === undefined || data.price === null || isNaN(data.price) || Number(data.price) <= 0) {
        errors.price = 'Price must be a number greater than 0';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};