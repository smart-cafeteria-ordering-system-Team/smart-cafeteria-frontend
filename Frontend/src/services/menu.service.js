/**
 * Menu Service
 * File: frontend/src/services/menu.service.js
 */

import api from "../js/api.js";

class MenuService {

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
            `/menu${queryString ? `?${queryString}` : ""}`
        );
    }

    async getAvailable(params = {}) {
        return this.getAll({
            ...params,
            available: true
        });
    }

    async getById(id) {
        if (!id) throw new Error("Menu item ID is required.");
        return api.get(`/menu/${id}`);
    }

    async create(data) {
        return api.post(
            "/menu",
            data
        );
    }

    async update(id, data) {
        if (!id) throw new Error("Menu item ID is required.");
        return api.put(
            `/menu/${id}`,
            data
        );
    }

    async delete(id) {
        if (!id) throw new Error("Menu item ID is required.");
        return api.delete(
            `/menu/${id}`
        );
    }

    async updateAvailability(id, available) {
        if (!id) throw new Error("Menu item ID is required.");
        return api.patch(
            `/menu/${id}/availability`,
            {
                available
            }
        );
    }

    async search(keyword) {
        if (!keyword || !keyword.trim()) {
            return this.getAll();
        }
        return api.get(
            `/menu/search?q=${encodeURIComponent(keyword.trim())}`
        );
    }
}

const menuService = new MenuService();

export default menuService;