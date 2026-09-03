/**
 * Authentication Service
 * File: frontend/src/services/auth.service.js
 */

import api from "../js/api.js";

class AuthService {

    async login(credentials) {
        const response = await api.post(
            "/auth/login",
            credentials
        );

        const token =
            response?.token ||
            response?.data?.token ||
            response?.accessToken;

        const user =
            response?.user ||
            response?.data?.user ||
            null;

        if (token) {
            api.setToken(token);
        }

        if (user) {
            localStorage.setItem(
                "current_user",
                JSON.stringify(user)
            );
        }

        return response;
    }

    async register(userData) {
        return api.post("/auth/register", userData);
    }

    async logout() {
        try {
            await api.post("/auth/logout");
        } catch (error) {
            console.warn(
                "Logout API request failed:",
                error.message
            );
        }

        api.removeToken();
        localStorage.removeItem("current_user");
    }

    async getProfile() {
        return api.get("/auth/me");
    }

    async updateProfile(data) {
        const response = await api.put(
            "/auth/me",
            data
        );

        const user =
            response?.user ||
            response?.data?.user ||
            null;

        if (user) {
            localStorage.setItem(
                "current_user",
                JSON.stringify(user)
            );
        }

        return response;
    }

    async changePassword(data) {
        return api.put(
            "/auth/password",
            data
        );
    }

    getCurrentUser() {
        const user = localStorage.getItem("current_user");

        if (!user) {
            return null;
        }

        try {
            return JSON.parse(user);
        } catch {
            return null;
        }
    }

    isAuthenticated() {
        return Boolean(api.getToken());
    }

    hasRole(role) {
        const user = this.getCurrentUser();

        return user?.role === role;
    }

    isAdmin() {
        return this.hasRole("admin");
    }

    isFoodMaker() {
        return this.hasRole("foodmaker");
    }

    isStudent() {
        return this.hasRole("student");
    }
}

const authService = new AuthService();

export default authService;