/**
 * Smart Cafeteria Ordering System
 * File: frontend/src/js/api.js
 *
 * Central API client.
 */

const API_BASE_URL = "http://localhost:5000/api/v1";

class ApiClient {
    constructor(baseURL = API_BASE_URL) {
        this.baseURL = baseURL;
        this.defaultTimeout = 15000;
    }

    getToken() {
        return localStorage.getItem("auth_token");
    }

    setToken(token) {
        if (token) {
            localStorage.setItem("auth_token", token);
        }
    }

    removeToken() {
        localStorage.removeItem("auth_token");
    }

    getHeaders(customHeaders = {}, body = null) {
        const token = this.getToken();
        const isFormData = body instanceof FormData;

        const headers = {
            Accept: "application/json",
            ...customHeaders
        };

        // Do not force Content-Type for FormData so browser can set boundary
        if (!isFormData) {
            headers["Content-Type"] = "application/json";
        }

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        return headers;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;

        const controller = new AbortController();
        const timeout = options.timeout || this.defaultTimeout;

        const timeoutId = setTimeout(() => {
            controller.abort();
        }, timeout);

        try {
            const isFormData = options.body instanceof FormData;

            const fetchOptions = {
                ...options,
                signal: controller.signal,
                headers: this.getHeaders(options.headers || {}, options.body)
            };

            if (
                fetchOptions.body &&
                typeof fetchOptions.body === "object" &&
                !isFormData
            ) {
                fetchOptions.body = JSON.stringify(fetchOptions.body);
            }

            const response = await fetch(url, fetchOptions);

            let data = null;

            const contentType = response.headers.get("content-type");

            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
            } else {
                const text = await response.text();

                try {
                    data = text ? JSON.parse(text) : null;
                } catch {
                    data = text;
                }
            }

            if (!response.ok) {
                const message =
                    data?.message ||
                    data?.error ||
                    `Request failed with status ${response.status}`;

                const error = new Error(message);
                error.status = response.status;
                error.data = data;

                if (response.status === 401) {
                    this.removeToken();

                    window.dispatchEvent(
                        new CustomEvent("auth:unauthorized")
                    );
                }

                throw error;
            }

            return data;
        } catch (error) {
            if (error.name === "AbortError") {
                throw new Error("Request timed out. Please try again.");
            }

            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    get(endpoint, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: "GET"
        });
    }

    post(endpoint, body = null, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: "POST",
            body
        });
    }

    put(endpoint, body = null, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: "PUT",
            body
        });
    }

    patch(endpoint, body = null, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: "PATCH",
            body
        });
    }

    delete(endpoint, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: "DELETE"
        });
    }

    upload(endpoint, formData, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: "POST",
            body: formData
        });
    }
}

const api = new ApiClient();

export default api;
export { ApiClient, API_BASE_URL };