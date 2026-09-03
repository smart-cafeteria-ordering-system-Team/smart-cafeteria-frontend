/**
 * Order Service
 * File: frontend/src/services/order.service.js
 */

import api from "../js/api.js";

class OrderService {

    async getAll(params = {}) {
        const query = new URLSearchParams();

        Object.entries(params).forEach(
            ([key, value]) => {
                if (
                    value !== undefined &&
                    value !== null &&
                    value !== ""
                ) {
                    query.append(key, value);
                }
            }
        );

        const queryString = query.toString();

        return api.get(
            `/orders${queryString ? `?${queryString}` : ""}`
        );
    }

    async getMyOrders(params = {}) {
        const query = new URLSearchParams();

        Object.entries(params).forEach(
            ([key, value]) => {
                if (
                    value !== undefined &&
                    value !== null &&
                    value !== ""
                ) {
                    query.append(key, value);
                }
            }
        );

        const queryString = query.toString();

        return api.get(
            `/orders/my-orders${queryString ? `?${queryString}` : ""}`
        );
    }

    async getById(id) {
        if (!id) throw new Error("Order ID is required.");
        return api.get(`/orders/${id}`);
    }

    async create(orderData) {
        return api.post(
            "/orders",
            orderData
        );
    }

    async update(id, data) {
        if (!id) throw new Error("Order ID is required.");
        return api.put(
            `/orders/${id}`,
            data
        );
    }

    async updateStatus(id, status) {
        if (!id) throw new Error("Order ID is required.");
        if (!status) throw new Error("Status is required.");
        return api.patch(
            `/orders/${id}/status`,
            {
                status
            }
        );
    }

    async cancel(id, reason = "") {
        if (!id) throw new Error("Order ID is required.");
        return api.patch(
            `/orders/${id}/cancel`,
            {
                reason
            }
        );
    }

    async delete(id) {
        if (!id) throw new Error("Order ID is required.");
        return api.delete(
            `/orders/${id}`
        );
    }

    async getPending(params = {}) {
        return this.getAll({
            ...params,
            status: "pending"
        });
    }

    async getPreparing(params = {}) {
        return this.getAll({
            ...params,
            status: "preparing"
        });
    }

    async getReady(params = {}) {
        return this.getAll({
            ...params,
            status: "ready"
        });
    }

    async getCompleted(params = {}) {
        return this.getAll({
            ...params,
            status: "completed"
        });
    }
}

const orderService = new OrderService();

export default orderService;