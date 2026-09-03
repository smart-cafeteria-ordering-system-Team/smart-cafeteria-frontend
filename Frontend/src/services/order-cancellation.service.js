/**
 * Order Cancellation Service
 * File: frontend/src/services/order-cancellation.service.js
 */

import api from "../js/api.js";

class OrderCancellationService {

    async cancelOrder(orderId, reason = "") {
        if (!orderId) throw new Error("Order ID is required.");
        return api.post(
            "/cancellations/request",
            {
                orderId,
                reason
            }
        );
    }

    async getCancellation(orderId) {
        if (!orderId) throw new Error("Order ID is required.");
        return api.get(
            `/orders/${orderId}/cancellation`
        );
    }

    async getAll() {
        return api.get(
            "/order-cancellations"
        );
    }

    async approveCancellation(
        cancellationId
    ) {
        if (!cancellationId) throw new Error("Cancellation ID is required.");
        return api.patch(
            `/order-cancellations/${cancellationId}/approve`
        );
    }

    async rejectCancellation(
        cancellationId,
        reason = ""
    ) {
        if (!cancellationId) throw new Error("Cancellation ID is required.");
        return api.patch(
            `/order-cancellations/${cancellationId}/reject`,
            {
                reason
            }
        );
    }
}

const orderCancellationService =
    new OrderCancellationService();

export default orderCancellationService;