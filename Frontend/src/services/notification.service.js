/**
 * Notification Service
 * File: frontend/src/services/notification.service.js
 */

import api from "../js/api.js";

class NotificationService {

    async getAll() {
        return api.get("/notifications");
    }

    async getUnread() {
        return api.get(
            "/notifications?read=false"
        );
    }

    async getUnreadCount() {
        return api.get(
            "/notifications/unread-count"
        );
    }

    async markAsRead(id) {
        if (!id) throw new Error("Notification ID is required.");
        return api.patch(
            `/notifications/${id}/read`
        );
    }

    async markAllAsRead() {
        return api.patch(
            "/notifications/read-all"
        );
    }

    async delete(id) {
        if (!id) throw new Error("Notification ID is required.");
        return api.delete(
            `/notifications/${id}`
        );
    }
}

const notificationService =
    new NotificationService();

export default notificationService;