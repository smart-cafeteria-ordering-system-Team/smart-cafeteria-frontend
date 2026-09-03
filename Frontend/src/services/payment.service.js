/**
 * Payment Service
 * File: frontend/src/services/payment.service.js
 */

import api from "../js/api.js";

class PaymentService {

    async createPayment(data) {
        return api.post(
            "/payments",
            data
        );
    }

    async getPaymentById(id) {
        if (!id) throw new Error("Payment ID is required.");
        return api.get(
            `/payments/${id}`
        );
    }

    async getPaymentByOrder(orderId) {
        if (!orderId) throw new Error("Order ID is required.");
        return api.get(
            `/payments/order/${orderId}`
        );
    }

    async getMyPayments() {
        return api.get(
            "/payments/my"
        );
    }

    async verifyPayment(id) {
        if (!id) throw new Error("Payment ID is required.");
        return api.patch(
            `/payments/${id}/verify`
        );
    }

    async updateStatus(id, status) {
        if (!id) throw new Error("Payment ID is required.");
        if (!status) throw new Error("Status is required.");
        return api.patch(
            `/payments/${id}/status`,
            {
                status
            }
        );
    }

    async refund(id, reason = "") {
        if (!id) throw new Error("Payment ID is required.");
        return api.post(
            `/payments/${id}/refund`,
            {
                reason
            }
        );
    }
}

const paymentService =
    new PaymentService();

export default paymentService;