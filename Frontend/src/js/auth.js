/**
 * Smart Cafeteria Ordering System
 * File: frontend/src/js/auth.js
 */

import authService from "../services/auth.service.js";

document.addEventListener("DOMContentLoaded", () => {
    initializeAuth();
});

async function initializeAuth() {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const logoutButton = document.getElementById("logoutBtn");

    if (loginForm) {
        loginForm.addEventListener("submit", handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener("submit", handleRegister);
    }

    if (logoutButton) {
        logoutButton.addEventListener("click", handleLogout);
    }

    updateAuthUI();
}

async function handleLogin(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const email = formData.get("email")?.trim();
    const password = formData.get("password");

    if (!email || !password) {
        showMessage("Email and password are required.", "danger");
        return;
    }

    try {
        setLoading(form, true);

        const result = await authService.login({
            email,
            password
        });

        showMessage("Login successful.", "success");

        const role = String(result?.user?.role || "").toLowerCase();
        let redirect;
        if (role === "admin") {
            redirect = "../admin/dashboard.html";
        } else if (role === "kitchen" || role === "staff" || role === "kitchen_staff") {
            redirect = "../kitchen/dashboard.html";
        } else {
            redirect = "../customer/menu.html";
        }

        setTimeout(() => {
            window.location.href = redirect;
        }, 700);

    } catch (error) {
        showMessage(error.message, "danger");
    } finally {
        setLoading(form, false);
    }
}

async function handleRegister(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const name = formData.get("name")?.trim();
    const email = formData.get("email")?.trim();
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (!name || !email || !password) {
        showMessage("Please fill in all required fields.", "danger");
        return;
    }

    if (password !== confirmPassword) {
        showMessage("Passwords do not match.", "danger");
        return;
    }

    try {
        setLoading(form, true);

        await authService.register({
            name,
            email,
            password,
            role: "student"
        });

        showMessage(
            "Registration successful. You can now login.",
            "success"
        );

        form.reset();

    } catch (error) {
        showMessage(error.message, "danger");
    } finally {
        setLoading(form, false);
    }
}

async function handleLogout() {
    try {
        await authService.logout();
    } catch (error) {
        console.error(error);
    }

    window.location.href = "../common/login.html";
}

function updateAuthUI() {
    const user = authService.getCurrentUser();

    const userNameElement = document.getElementById("currentUserName");

    if (userNameElement && user) {
        userNameElement.textContent = user.name || user.email;
    }
}

function setLoading(form, loading) {
    const button = form.querySelector(
        'button[type="submit"], input[type="submit"]'
    );

    if (!button) return;

    button.disabled = loading;

    if (loading) {
        // Save original HTML content to preserve icons/formatting if any exist
        button.dataset.originalHtml = button.innerHTML;
        button.innerHTML = "Please wait...";
    } else {
        button.innerHTML =
            button.dataset.originalHtml || button.innerHTML;
    }
}

function showMessage(message, type = "info") {
    let container = document.getElementById("authMessage");

    if (!container) {
        container = document.createElement("div");
        container.id = "authMessage";
        container.className = "alert";
        document.body.prepend(container);
    }

    container.className = `alert alert-${type}`;
    container.textContent = message;
}

window.authLogout = handleLogout;