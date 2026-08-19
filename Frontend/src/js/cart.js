/**
 * ================================================================
 * SMART CAFETERIA ORDERING SYSTEM - CART MODULE
 * ================================================================
 * Handles shopping cart operations:
 * add, remove, update, clear, notes, and listeners.
 * ================================================================
 */

import { CartStorage } from './utils/storage.js';
import { getMenuItemById } from './menu.js';
import { showToast } from './main.js';

// ===== 1. CART STATE =====

let cartItems = [];
let cartListeners = [];

// ===== 2. LOAD CART =====

function loadCart() {
    try {
        const storedCart = CartStorage.get();

        cartItems = Array.isArray(storedCart)
            ? storedCart
            : [];

        return cartItems;
    } catch (error) {
        console.error('Load cart error:', error);

        cartItems = [];

        return cartItems;
    }
}

// ===== 3. SAVE CART =====

function saveCart() {
    try {
        CartStorage.save(cartItems);

        notifyCartListeners();

        return cartItems;
    } catch (error) {
        console.error('Save cart error:', error);

        return cartItems;
    }
}

// ===== 4. CART FUNCTIONS =====

/**
 * Get all cart items
 *
 * @returns {Array}
 */
export function getCartItems() {
    return [...loadCart()];
}

/**
 * Get cart item count
 * Total quantity of all products.
 *
 * @returns {number}
 */
export function getCartCount() {
    return loadCart().reduce(
        (sum, item) => {
            const quantity = Number(item.quantity) || 0;

            return sum + quantity;
        },
        0
    );
}

/**
 * Get cart total price
 *
 * @returns {number}
 */
export function getCartTotal() {
    return loadCart().reduce(
        (sum, item) => {
            const price = Number(item.price) || 0;
            const quantity = Number(item.quantity) || 0;

            return sum + price * quantity;
        },
        0
    );
}

/**
 * Check if cart is empty
 *
 * @returns {boolean}
 */
export function isCartEmpty() {
    return getCartCount() === 0;
}

/**
 * Add item to cart
 *
 * @param {number|string} itemId
 * @param {number} quantity
 * @param {Object} options
 * @returns {Array}
 */
export function addToCart(
    itemId,
    quantity = 1,
    options = {}
) {
    const numericId =
        typeof itemId === 'string'
            ? parseInt(itemId, 10)
            : itemId;

    const menuItem =
        getMenuItemById(numericId);

    // ------------------------------------------------------------
    // Check item
    // ------------------------------------------------------------

    if (!menuItem) {
        showToast(
            'Item not found',
            'error'
        );

        return getCartItems();
    }

    // ------------------------------------------------------------
    // Check availability
    // ------------------------------------------------------------

    if (!menuItem.availability) {
        showToast(
            'This item is currently unavailable',
            'warning'
        );

        return getCartItems();
    }

    // ------------------------------------------------------------
    // Validate quantity
    // ------------------------------------------------------------

    const numericQuantity =
        Number(quantity);

    if (
        !Number.isFinite(numericQuantity) ||
        numericQuantity <= 0
    ) {
        showToast(
            'Quantity must be at least 1',
            'warning'
        );

        return getCartItems();
    }

    // Make sure quantity is a whole number.
    const finalQuantity =
        Math.floor(numericQuantity);

    let cart = loadCart();

    // ------------------------------------------------------------
    // Check if item already exists
    // ------------------------------------------------------------

    const existingIndex =
        cart.findIndex(
            item =>
                Number(item.itemId) ===
                Number(numericId)
        );

    if (existingIndex !== -1) {
        // Update existing quantity.
        cart[existingIndex].quantity =
            Number(cart[existingIndex].quantity || 0) +
            finalQuantity;

        // Update basic product information
        // in case menu data has changed.
        cart[existingIndex].name =
            menuItem.name;

        cart[existingIndex].price =
            menuItem.price;

        cart[existingIndex].icon =
            menuItem.icon;

        cart[existingIndex].image =
            menuItem.image;

        // Update notes only when supplied.
        if (
            options &&
            typeof options.notes === 'string' &&
            options.notes.trim() !== ''
        ) {
            cart[existingIndex].notes =
                options.notes.trim();
        }
    } else {
        // --------------------------------------------------------
        // Add new cart item
        // --------------------------------------------------------

        cart.push({
            itemId: numericId,

            name: menuItem.name,

            price: Number(menuItem.price) || 0,

            quantity: finalQuantity,

            icon:
                menuItem.icon ||
                '🍽️',

            image:
                menuItem.image ||
                null,

            notes:
                typeof options.notes === 'string'
                    ? options.notes.trim()
                    : '',

            addedAt:
                new Date().toISOString()
        });
    }

    saveCart();

    const itemName =
        menuItem.name?.en ||
        'Item';

    showToast(
        `Added ${itemName} to cart`,
        'success'
    );

    return getCartItems();
}

/**
 * Update item quantity
 *
 * @param {number|string} itemId
 * @param {number} quantity
 * @returns {Array}
 */
export function updateCartItem(
    itemId,
    quantity
) {
    const numericId =
        typeof itemId === 'string'
            ? parseInt(itemId, 10)
            : itemId;

    const numericQuantity =
        Number(quantity);

    let cart = loadCart();

    const index =
        cart.findIndex(
            item =>
                Number(item.itemId) ===
                Number(numericId)
        );

    if (index === -1) {
        showToast(
            'Item not found in cart',
            'warning'
        );

        return getCartItems();
    }

    // ------------------------------------------------------------
    // Quantity <= 0 means remove item
    // ------------------------------------------------------------

    if (
        !Number.isFinite(numericQuantity) ||
        numericQuantity <= 0
    ) {
        return removeFromCart(numericId);
    }

    cart[index].quantity =
        Math.floor(numericQuantity);

    saveCart();

    return getCartItems();
}

/**
 * Increase cart item quantity by one
 *
 * @param {number|string} itemId
 * @returns {Array}
 */
export function increaseCartItem(itemId) {
    const currentQuantity =
        getItemQuantity(itemId);

    return updateCartItem(
        itemId,
        currentQuantity + 1
    );
}

/**
 * Decrease cart item quantity by one
 *
 * @param {number|string} itemId
 * @returns {Array}
 */
export function decreaseCartItem(itemId) {
    const currentQuantity =
        getItemQuantity(itemId);

    if (currentQuantity <= 1) {
        return removeFromCart(itemId);
    }

    return updateCartItem(
        itemId,
        currentQuantity - 1
    );
}

/**
 * Remove item from cart
 *
 * @param {number|string} itemId
 * @returns {Array}
 */
export function removeFromCart(itemId) {
    const numericId =
        typeof itemId === 'string'
            ? parseInt(itemId, 10)
            : itemId;

    let cart = loadCart();

    const index =
        cart.findIndex(
            item =>
                Number(item.itemId) ===
                Number(numericId)
        );

    if (index === -1) {
        showToast(
            'Item not found in cart',
            'warning'
        );

        return getCartItems();
    }

    const itemName =
        cart[index]?.name?.en ||
        'Item';

    cart.splice(index, 1);

    saveCart();

    showToast(
        `Removed ${itemName} from cart`,
        'info'
    );

    return getCartItems();
}

/**
 * Clear entire cart
 *
 * @param {boolean} showConfirm
 * @returns {Array}
 */
export function clearCart(
    showConfirm = true
) {
    if (showConfirm) {
        const confirmed =
            window.confirm(
                'Are you sure you want to clear your cart?'
            );

        if (!confirmed) {
            return getCartItems();
        }
    }

    try {
        CartStorage.clear();
    } catch (error) {
        console.error(
            'Clear cart storage error:',
            error
        );
    }

    cartItems = [];

    notifyCartListeners();

    showToast(
        'Cart cleared',
        'info'
    );

    return [];
}

/**
 * Get cart item quantity
 *
 * @param {number|string} itemId
 * @returns {number}
 */
export function getItemQuantity(itemId) {
    const numericId =
        typeof itemId === 'string'
            ? parseInt(itemId, 10)
            : itemId;

    const cart = loadCart();

    const item =
        cart.find(
            cartItem =>
                Number(cartItem.itemId) ===
                Number(numericId)
        );

    return item
        ? Number(item.quantity) || 0
        : 0;
}

/**
 * Check whether item is in cart
 *
 * @param {number|string} itemId
 * @returns {boolean}
 */
export function isInCart(itemId) {
    return getItemQuantity(itemId) > 0;
}

/**
 * Get cart item
 *
 * @param {number|string} itemId
 * @returns {Object|null}
 */
export function getCartItem(itemId) {
    const numericId =
        typeof itemId === 'string'
            ? parseInt(itemId, 10)
            : itemId;

    const cart = loadCart();

    return (
        cart.find(
            item =>
                Number(item.itemId) ===
                Number(numericId)
        ) || null
    );
}

/**
 * Add/update notes on cart item
 *
 * @param {number|string} itemId
 * @param {string} notes
 * @returns {Array}
 */
export function addItemNotes(
    itemId,
    notes
) {
    const numericId =
        typeof itemId === 'string'
            ? parseInt(itemId, 10)
            : itemId;

    let cart = loadCart();

    const index =
        cart.findIndex(
            item =>
                Number(item.itemId) ===
                Number(numericId)
        );

    if (index === -1) {
        showToast(
            'Item not found in cart',
            'warning'
        );

        return getCartItems();
    }

    cart[index].notes =
        typeof notes === 'string'
            ? notes.trim()
            : '';

    saveCart();

    return getCartItems();
}

/**
 * Get subtotal for one cart item
 *
 * @param {Object} item
 * @returns {number}
 */
export function getItemSubtotal(item) {
    if (!item) {
        return 0;
    }

    const price =
        Number(item.price) || 0;

    const quantity =
        Number(item.quantity) || 0;

    return price * quantity;
}

/**
 * Get detailed cart summary
 *
 * @returns {Object}
 */
export function getCartSummary() {
    const items = loadCart();

    const itemCount =
        items.reduce(
            (sum, item) =>
                sum +
                (Number(item.quantity) || 0),
            0
        );

    const subtotal =
        items.reduce(
            (sum, item) =>
                sum + getItemSubtotal(item),
            0
        );

    return {
        items: [...items],
        itemCount,
        subtotal,
        total: subtotal
    };
}

// ===== 5. CART LISTENERS =====

/**
 * Add cart change listener
 *
 * @param {Function} listener
 */
export function addCartListener(
    listener
) {
    if (
        typeof listener !== 'function'
    ) {
        return;
    }

    // Prevent duplicate listeners.
    if (!cartListeners.includes(listener)) {
        cartListeners.push(listener);
    }
}

/**
 * Remove cart change listener
 *
 * @param {Function} listener
 */
export function removeCartListener(
    listener
) {
    cartListeners =
        cartListeners.filter(
            currentListener =>
                currentListener !== listener
        );
}

/**
 * Notify all cart listeners
 */
function notifyCartListeners() {
    const items = getCartItems();

    cartListeners.forEach(
        listener => {
            try {
                listener(items);
            } catch (error) {
                console.error(
                    'Cart listener error:',
                    error
                );
            }
        }
    );
}

// ===== 6. STORAGE SYNCHRONIZATION =====

/**
 * Reload cart from localStorage.
 *
 * Useful when another browser tab changes
 * the cart.
 */
export function refreshCart() {
    loadCart();

    notifyCartListeners();

    return getCartItems();
}

/**
 * Listen for cart changes from another tab.
 */
function handleStorageChange(event) {
    if (!event) {
        return;
    }

    // If CartStorage uses its own storage key,
    // the storage event can be handled here.
    if (
        event.key === 'scos_cart' ||
        event.key === 'cart'
    ) {
        refreshCart();
    }
}

window.addEventListener(
    'storage',
    handleStorageChange
);

// ===== 7. INITIALIZATION =====

loadCart();

// ===== 8. DEFAULT EXPORT =====

export default {
    getCartItems,
    getCartCount,
    getCartTotal,
    getCartSummary,
    getItemSubtotal,

    isCartEmpty,

    addToCart,
    updateCartItem,

    increaseCartItem,
    decreaseCartItem,

    removeFromCart,
    clearCart,

    getItemQuantity,
    isInCart,
    getCartItem,

    addItemNotes,

    addCartListener,
    removeCartListener,

    refreshCart
};
