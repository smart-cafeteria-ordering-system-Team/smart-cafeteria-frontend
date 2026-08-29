// validators/menu.validator.js

const validateMenuItemInput = (data) => {
    const errors = {};

    // Name
    const name = data.name?.trim();

    if (!name) {
        errors.name = 'Menu item name is required';
    } else if (name.length > 100) {
        errors.name = 'Menu item name cannot exceed 100 characters';
    }

    // Category
    const category = data.category?.trim();

    if (!category) {
        errors.category = 'Category is required';
    } else if (category.length > 50) {
        errors.category = 'Category cannot exceed 50 characters';
    }

    // Price
    const price = Number(data.price);

    if (
        data.price === undefined ||
        data.price === null ||
        data.price === '' ||
        !Number.isFinite(price) ||
        price <= 0
    ) {
        errors.price = 'Price must be a number greater than 0';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};
module.exports = { validateMenuItemInput };
