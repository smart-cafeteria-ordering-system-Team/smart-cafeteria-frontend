/**
 * Feedback Service
 * File: frontend/src/services/feedback.service.js
 */

import api from "../js/api.js";

class FeedbackService {

    async getAll() {
        return api.get("/feedback");
    }

    async getById(id) {
        if (!id) throw new Error("Feedback ID is required.");
        return api.get(`/feedback/${id}`);
    }

    async getByOrder(orderId) {
        if (!orderId) throw new Error("Order ID is required.");
        return api.get(
            `/feedback/order/${orderId}`
        );
    }

    async create(data) {
        return api.post(
            "/feedback",
            data
        );
    }

    async update(id, data) {
        if (!id) throw new Error("Feedback ID is required.");
        return api.put(
            `/feedback/${id}`,
            data
        );
    }

    async delete(id) {
        if (!id) throw new Error("Feedback ID is required.");
        return api.delete(
            `/feedback/${id}`
        );
    }

    async submitRating(orderId, rating, comment = "") {
        if (!orderId) throw new Error("Order ID is required.");
        if (rating === undefined || rating === null) throw new Error("Rating is required.");

        return this.create({
            orderId,
            rating,
            comment
        });
    }
}

const feedbackService = new FeedbackService();

export default feedbackService;