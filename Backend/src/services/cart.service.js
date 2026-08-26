const carts = new Map(); // Key: userId, Value: array of cart items

export const getCart = async (userId) => {
    return carts.get(userId) || [];
};

export const addToCart = async (userId, item) => {
    let userCart = carts.get(userId) || [];
    const existingIndex = userCart.findIndex(i => i.itemId === item.itemId);

    if (existingIndex > -1) {
        userCart[existingIndex].quantity += item.quantity || 1;
    } else {
        userCart.push({
            itemId: item.itemId,
            name: item.name,
            price: item.price,
            quantity: item.quantity || 1
        });
    }

    carts.set(userId, userCart);
    return userCart;
};

export const clearCart = async (userId) => {
    carts.delete(userId);
    return true;
};