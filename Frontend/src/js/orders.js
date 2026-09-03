/**
 * ================================================================
 * SMART CAFETERIA ORDERING SYSTEM - ORDERS MODULE
 * ================================================================
 * Phase 4: delegates to the real backend (order.service.js) instead of
 * the old in-memory mock data. Exported function names are preserved so
 * existing callers keep working.
 * ================================================================
 */

import orderService from "../services/order.service.js";
import { getCurrentUser } from "./auth.js";

// ===== 1. ORDERS STATE (cache hydrated from the API) =====
let orders = [];
let orderListeners = [];

// Lightweight cache for synchronous read helpers.
const hydrateCache = (list) => {
    if (Array.isArray(list) && list.length >= 0) {
        orders = list;
    }
    return list;
};

const normalizeOrder = (order) => {
    if (!order) return null;
    return {
        ...order,
        id: order.id || order.orderId || order.orderNumber || order._id,
        orderId: order.orderId || order.orderNumber || order._id,
        status: order.status || order.orderStatus || "pending",
    };
};

const notifyOrderListeners = () => {
    orderListeners.forEach((listener) => {
        try {
            listener(orders);
        } catch (error) {
            console.error("Order listener error:", error);
        }
    });
};

// ===== 2. ORDER FUNCTIONS =====

/**
 * Get all orders (Admin only)
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Orders
 */
export async function getAllOrders(filters = {}) {
    try {
        const data = await orderService.getAll(filters);
        const list = (data?.orders || []).map(normalizeOrder);
        hydrateCache(list);
        return list;
    } catch (error) {
        console.error("Get all orders error:", error);
        return [];
    }
}

/**
 * Get user's orders
 * @param {string} userId - User ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} User orders
 */
export async function getUserOrders(userId, filters = {}) {
    if (userId && getCurrentUser()?.id === userId) {
        return getMyOrders(filters);
    }
    const all = await getAllOrders(filters);
    return all.filter((order) => order.userId === userId || String(order.user || "") === String(userId || ""));
}

/**
 * Get current user's orders
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Current user's orders
 */
export async function getMyOrders(filters = {}) {
    try {
        const data = await orderService.getMyOrders(filters);
        const list = (data?.orders || []).map(normalizeOrder);
        hydrateCache(list);
        return list;
    } catch (error) {
        console.error("Get my orders error:", error);
        return [];
    }
}

/**
 * Get order by ID
 * @param {string} orderId - Order ID
 * @returns {Promise<Object|null>} Order or null
 */
export async function getOrderById(orderId) {
    const cached = orders.find((order) => order.id === orderId);
    if (cached) return cached;

    try {
        const data = await orderService.getById(orderId);
        const order = normalizeOrder(data?.order);
        if (order) {
            const exists = orders.some((o) => o.id === order.id);
            if (!exists) orders.push(order);
        }
        return order;
    } catch (error) {
        console.warn("Get order by id error:", error);
        return null;
    }
}

/**
 * Place a new order
 * @param {Object} orderData - Order data
 * @returns {Promise<Object>} Created order or error
 */
export async function placeOrder(orderData) {
    try {
        const user = getCurrentUser();
        if (!user) {
            return { success: false, error: "Please login to place an order" };
        }

        const items = orderData.items || [];
        if (!items || items.length === 0) {
            return { success: false, error: "Cart is empty" };
        }

        const payload = {
            items: items.map((item) => ({
                id: String(item.id || item.itemId || item.menuItemId),
                quantity: Number(item.quantity) || 1,
                notes: item.notes || "",
            })),
            customerName: orderData.customerName || user.name || user.fullName || "",
            customerPhone: orderData.customerPhone || user.phone || "",
            orderType: orderData.orderType || "dine-in",
            tableNumber: orderData.tableNumber || "N/A",
            paymentMethod: orderData.paymentMethod || "Cash",
            totalAmount: orderData.totalAmount || 0,
            notes: orderData.notes || "",
        };

        const data = await orderService.create(payload);
        const order = normalizeOrder(data?.order);

        if (order) {
            const exists = orders.some((o) => o.id === order.id);
            if (!exists) orders.unshift(order);
            notifyOrderListeners();
        }

        try {
            localStorage.removeItem("smart_cafeteria_cart");
            window.dispatchEvent(new CustomEvent("cart:updated", { detail: [] }));
        } catch (error) {
            console.warn("Could not clear local cart:", error);
        }

        return { success: true, order };
    } catch (error) {
        console.error("Place order error:", error);
        return { success: false, error: error.message || "Failed to place order" };
    }
}

/**
 * Update order status (Kitchen/Admin)
 * @param {string} orderId - Order ID
 * @param {string} status - New status
 * @returns {Promise<Object>} Updated order or error
 */
export async function updateOrderStatus(orderId, status) {
    try {
        if (!status) return { success: false, error: "Invalid status" };

        const data = await orderService.updateStatus(orderId, status);
        const order = normalizeOrder(data?.order || data?.updatedOrder);

        if (order) {
            orders = orders.map((o) => (o.id === order.id ? order : o));
            notifyOrderListeners();
        }

        return { success: true, order };
    } catch (error) {
        console.error("Update order status error:", error);
        return { success: false, error: error.message || "Failed to update order status" };
    }
}

/**
 * Mark order as ready (Kitchen)
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} Updated order or error
 */
export async function markOrderReady(orderId) {
    return updateOrderStatus(orderId, "ready");
}

/**
 * Mark order as served (Kitchen/Admin)
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} Updated order or error
 */
export async function markOrderServed(orderId) {
    return updateOrderStatus(orderId, "served");
}

/**
 * Cancel order (Customer)
 * @param {string} orderId - Order ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise<Object>} Success or error
 */
export async function cancelOrder(orderId, reason = "") {
    try {
        const data = await orderService.cancel(orderId, reason);
        const order = normalizeOrder(data?.order);

        if (order) {
            orders = orders.map((o) => (o.id === order.id ? order : o));
            notifyOrderListeners();
        }

        return { success: true, order };
    } catch (error) {
        console.error("Cancel order error:", error);
        return { success: false, error: error.message || "Failed to cancel order" };
    }
}

/**
 * Get order status
 * @param {string} orderId - Order ID
 * @returns {Promise<string|null>} Status or null
 */
export async function getOrderStatus(orderId) {
    const order = orders.find((o) => o.id === orderId);
    if (order) return order.status;
    const found = await getOrderById(orderId);
    return found ? found.status : null;
}

/**
 * Check if order can be cancelled
 * @param {string} orderId - Order ID
 * @returns {Promise<boolean>}
 */
export async function canCancelOrder(orderId) {
    const order = orders.find((o) => o.id === orderId) || (await getOrderById(orderId));
    if (!order) return false;
    const status = String(order.status || "").toLowerCase();
    return status === "pending" || status === "preparing";
}

/**
 * Get order status history
 * @param {string} orderId - Order ID
 * @returns {Promise<Array>} Status history
 */
export async function getOrderStatusHistory(orderId) {
    const order =
        orders.find((o) => o.id === orderId) ||
        (await getOrderById(orderId));
    if (!order) return [];

    const history = [
        { status: "pending", time: order.orderTime || new Date().toISOString(), label: "Order placed" },
    ];
    const current = String(order.status || "").toLowerCase();

    if (current === "preparing" || current === "ready" || current === "completed") {
        history.push({ status: "preparing", time: order.orderDate || new Date().toISOString(), label: "Order accepted" });
    }
    if (current === "ready" || current === "completed") {
        history.push({ status: "ready", time: order.orderDate || new Date().toISOString(), label: "Order ready for pickup" });
    }
    if (current === "completed" || current === "served") {
        history.push({ status: "completed", time: order.orderDate || new Date().toISOString(), label: "Order served" });
    }

    return history;
}

// ===== 3. ORDER STATISTICS =====

/**
 * Get order statistics for admin dashboard
 * @returns {Promise<Object>} Statistics
 */
export async function getOrderStats() {
    const list =
        orders.length > 0
            ? orders
            : await getAllOrders();

    const count = (statuses) => list.filter((o) => statuses.includes(String(o.status || "").toLowerCase())).length;

    const total = list.length;
    const pending = count(["pending", "received"]);
    const preparing = count(["preparing"]);
    const ready = count(["ready"]);
    const served = count(["completed", "served"]);
    const cancelled = count(["cancelled"]);
    const totalRevenue = list
        .filter((o) => String(o.status || "").toLowerCase() !== "cancelled")
        .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

    const today = new Date().toISOString().split("T")[0];
    const todayOrders = list.filter((o) => {
        const t = o.orderTime || o.orderDate || "";
        return String(t).startsWith(today);
    });

    return {
        total,
        pending,
        preparing,
        ready,
        served,
        cancelled,
        totalRevenue,
        todayOrders: todayOrders.length,
        todayRevenue: todayOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0),
    };
}

/**
 * Get kitchen order statistics
 * @returns {Promise<Object>} Kitchen stats
 */
export async function getKitchenStats() {
    const list =
        orders.length > 0
            ? orders
            : await getAllOrders();

    const count = (statuses) => list.filter((o) => statuses.includes(String(o.status || "").toLowerCase())).length;

    const pending = count(["pending", "received"]);
    const preparing = count(["preparing"]);
    const ready = count(["ready"]);
    const activeOrders = list.filter((o) =>
        ["pending", "received", "preparing"].includes(String(o.status || "").toLowerCase())
    );

    return {
        pending,
        preparing,
        ready,
        activeOrders: activeOrders.length,
        activeOrdersList: activeOrders,
    };
}

// ===== 4. ORDER LISTENERS =====

/**
 * Add order change listener
 * @param {Function} listener - Callback function
 */
export function addOrderListener(listener) {
    if (typeof listener === "function") {
        orderListeners.push(listener);
    }
}

/**
 * Remove order change listener
 * @param {Function} listener - Callback function
 */
export function removeOrderListener(listener) {
    orderListeners = orderListeners.filter((l) => l !== listener);
}

// ===== 5. EXPORTS =====
export default {
    getAllOrders,
    getUserOrders,
    getMyOrders,
    getOrderById,
    placeOrder,
    updateOrderStatus,
    markOrderReady,
    markOrderServed,
    cancelOrder,
    getOrderStatus,
    canCancelOrder,
    getOrderStatusHistory,
    getOrderStats,
    getKitchenStats,
    addOrderListener,
    removeOrderListener,
};