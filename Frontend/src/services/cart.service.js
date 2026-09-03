/**
 * Cart Service
 * File: frontend/src/services/cart.service.js
 */

import api from "../js/api.js";

const CART_KEY = "smart_cafeteria_cart";

class CartService {

    getCart() {
        const cart = localStorage.getItem(CART_KEY);

        if (!cart) {
            return [];
        }

        try {
            const parsed = JSON.parse(cart);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    saveCart(cart) {
        localStorage.setItem(
            CART_KEY,
            JSON.stringify(cart)
        );

        window.dispatchEvent(
            new CustomEvent("cart:updated", {
                detail: cart
            })
        );
    }

    addItem(product, quantity = 1) {
        const cart = this.getCart();
        const parsedQuantity = parseInt(quantity, 10) || 1;

        const existing = cart.find(
            item => String(item.id) === String(product.id)
        );

        if (existing) {
            existing.quantity += parsedQuantity;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: Number(product.price) || 0,
                image: product.image || "",
                quantity: parsedQuantity
            });
        }

        this.saveCart(cart);
        return cart;
    }

    removeItem(productId) {
        const cart = this.getCart().filter(
            item => String(item.id) !== String(productId)
        );

        this.saveCart(cart);
        return cart;
    }

    increaseQuantity(productId) {
        const cart = this.getCart();

        const item = cart.find(
            item => String(item.id) === String(productId)
        );

        if (item) {
            item.quantity++;
            this.saveCart(cart);
        }

        return cart;
    }

    decreaseQuantity(productId) {
        const cart = this.getCart();

        const item = cart.find(
            item => String(item.id) === String(productId)
        );

        if (item) {
            item.quantity--;

            if (item.quantity <= 0) {
                return this.removeItem(productId);
            }
            
            this.saveCart(cart);
        }

        return cart;
    }

    clearCart() {
        localStorage.removeItem(CART_KEY);

        window.dispatchEvent(
            new CustomEvent("cart:updated", {
                detail: []
            })
        );
    }

    getItemCount() {
        return this.getCart().reduce(
            (total, item) => total + Number(item.quantity || 0),
            0
        );
    }

    getTotal() {
        return this.getCart().reduce(
            (total, item) =>
                total +
                Number(item.price || 0) *
                Number(item.quantity || 0),
            0
        );
    }

    getItem(productId) {
        return this.getCart().find(
            item => String(item.id) === String(productId)
        );
    }

    async syncWithServer() {
        try {
            return await api.get("/cart");
        } catch (error) {
            console.warn("Could not sync cart with server:", error.message);
            return null;
        }
    }

    async checkout() {
        const cart = this.getCart();

        if (cart.length === 0) {
            throw new Error("Your cart is empty.");
        }

        let user = null;
        try {
            const raw = localStorage.getItem("current_user");
            user = raw ? JSON.parse(raw) : null;
        } catch {
            user = null;
        }

        const response = await api.post(
            "/orders",
            {
                items: cart.map(item => ({
                    // Backend resolves item references via id | foodItem | menuItemId | itemId
                    id: String(item.menuItemId || item.id),
                    quantity: Number(item.quantity) || 1,
                    notes: item.notes || ""
                })),
                customerName: user?.name || user?.fullName || "",
                customerPhone: user?.phone || "",
                paymentMethod: "Cash"
            }
        );

        this.clearCart();

        return response;
    }
}

const cartService = new CartService();

export default cartService;