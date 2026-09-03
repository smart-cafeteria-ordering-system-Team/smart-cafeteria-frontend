/**
 * Order status/tracking page.
 * Phase 4: fetches the live order from MongoDB (GET /orders/:id) when the
 * student is logged in, and cancels through PATCH /orders/:id/cancel.
 * Falls back to localStorage when offline / not authenticated.
 */

(function () {
    const API_BASE_URL = "http://localhost:5000/api/v1";

    window.getApiToken = function () {
        return localStorage.getItem("auth_token") || localStorage.getItem("token") || "";
    };

    window.getOrderFromApi = async function (orderId) {
        const token = window.getApiToken();
        if (!token) return null;

        try {
            const response = await fetch(`${API_BASE_URL}/orders/${encodeURIComponent(orderId)}`, {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw { status: 401 };
                }
                return null;
            }

            const data = await response.json();
            const order = data?.order || null;
            if (!order) return null;

            const rawStatus = String(order.status || order.orderStatus || "pending").toLowerCase();
            let displayStatus = "Pending";
            if (rawStatus === "cancelled") displayStatus = "Cancelled";
            if (rawStatus === "completed" || rawStatus === "served") displayStatus = "Completed";
            if (rawStatus === "preparing") displayStatus = "Preparing";
            if (rawStatus === "ready") displayStatus = "Ready";

            return {
                orderId: order.orderId || order.orderNumber || order.id,
                id: order.orderId || order.orderNumber || order.id,
                orderDate: order.orderDate,
                orderType: order.orderType || "dine-in",
                tableNumber: order.tableNumber || "-",
                customerName: order.customerName,
                customerPhone: order.customerPhone,
                paymentMethod: order.paymentMethod || "Telebirr",
                paymentStatus: order.paymentStatus || order.payment?.status || "unpaid",
                payment: order.payment || null,
                transactionId: order.transactionId || null,
                items: Array.isArray(order.items) ? order.items : [],
                subtotal: order.subtotal,
                serviceFee: order.serviceFee,
                totalAmount: order.totalAmount,
                orderTime: order.orderTime,
                status: displayStatus
            };
        } catch (error) {
            if (error && error.status === 401) {
                window.location.href = "../common/login.html";
            }
            console.warn("Could not load order from server:", error && error.message);
            return null;
        }
    };
})();

/**
 * Attached to window object for live cancellation from status receipt page.
 * Phase 4: cancels through the backend when logged in.
 */
window.cancelOrderFromStatusPage = function (orderId) {
    if (!confirm(`Are you sure you want to cancel order #${orderId}?`)) {
        return;
    }

    const token = window.getApiToken();

    if (token) {
        fetch(`http://localhost:5000/api/v1/orders/${encodeURIComponent(orderId)}/cancel`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ reason: "Cancelled by customer" })
        })
            .then(function (response) {
                if (!response.ok) {
                    return response.json().then(function (data) {
                        throw new Error(data?.error || "Failed to cancel order");
                    });
                }
                return response.json();
            })
            .then(function () {
                applyLocalCancellation(orderId);
                alert(`Order #${orderId} has been successfully cancelled.`);
                location.reload();
            })
            .catch(function (error) {
                if (error.message === "Failed to cancel order") {
                    const changed = applyLocalCancellation(orderId);
                    if (changed) {
                        alert(`Order #${orderId} has been successfully cancelled.`);
                        location.reload();
                    } else {
                        alert(error.message);
                    }
                } else {
                    console.warn("Server cancellation failed:", error.message);
                }
            });
        return;
    }

    const changed = applyLocalCancellation(orderId);
    if (changed) {
        alert(`Order #${orderId} has been successfully cancelled.`);
        location.reload();
    } else {
        alert("Unable to find order to cancel.");
    }
};

function applyLocalCancellation(orderId) {
    let latestOrder = JSON.parse(localStorage.getItem("latestOrder"));
    let historyData = JSON.parse(localStorage.getItem("orderHistory")) || [];
    let changed = false;

    if (latestOrder) {
        const latestId = latestOrder.orderId || latestOrder.id;
        if (latestId === orderId) {
            latestOrder.status = "Cancelled";
            localStorage.setItem("latestOrder", JSON.stringify(latestOrder));
            changed = true;
        }
    }

    historyData = historyData.map(function (order) {
        const id = order.orderId || order.id;
        if (id === orderId) {
            order.status = "Cancelled";
            changed = true;
        }
        return order;
    });

    if (changed) {
        localStorage.setItem("orderHistory", JSON.stringify(historyData));
    }
    return changed;
}

// ================================================================
// Phase 7 - Real payment status display (Paid / Pending / Failed)
// ================================================================

function normalizePaymentStatus(value) {
    const s = String(value || "").toLowerCase();
    if (["paid", "completed", "success", "simulated"].indexOf(s) !== -1) return "Paid";
    if (["failed", "cancelled", "canceled", "reversed"].indexOf(s) !== -1) return "Failed";
    if (["pending"].indexOf(s) !== -1) return "Pending Payment";
    return "Pending Payment";
}

window.verifyOrderPayment = function (orderId) {
    const token = window.getApiToken();
    if (!token || !orderId) return Promise.resolve(false);
    return fetch("http://localhost:5000/api/v1/payments/verify", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: "Bearer " + token
        },
        body: JSON.stringify({ txRef: orderId })
    })
        .then(function (r) { return r.json(); })
        .then(function (d) { return !!(d && d.success); })
        .catch(function () { return false; });
};

function renderPaymentStatus(orderData, currentId) {
    const statusEl = document.getElementById("receipt-payment-status");
    const status = normalizePaymentStatus(
        orderData.paymentStatus || (orderData.payment && orderData.payment.status) || "pending"
    );

    const color = status === "Paid" ? "#15803d" : (status === "Failed" ? "#dc3545" : "#b45309");
    if (statusEl) {
        statusEl.innerHTML = '<span style="color:' + color + ';font-weight:700;">' + status + "</span>";
    }

    // Helper unused (currentId kept for signature compatibility).
}

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const requestedId = urlParams.get("orderId");

    function renderOrderStatus(orderData) {
        // Render empty state if no order is found
        if (!orderData) {
            const mainContent = document.querySelector("main");
            if (mainContent) {
                mainContent.innerHTML = `
                    <section class="status-banner" style="max-width: 500px; margin: 40px auto; text-align: center; background: #fff; padding: 30px; border-radius: 10px;">
                        <i class="fa-solid fa-magnifying-glass" style="font-size: 3rem; color: #ff6b00; margin-bottom: 12px;"></i>
                        <h2>No Active Order Found</h2>
                        <p style="color: #6b7280; margin-bottom: 16px;">You don't have an active order tracking session right now.</p>
                        <a href="menu.html" class="btn btn-primary" style="display: inline-block; padding: 10px 20px; background: #ff6b00; color: #fff; border-radius: 6px; text-decoration: none;">View Menu</a>
                    </section>
                `;
            }
            return;
        }

        const currentId = orderData.orderId || orderData.id || "ET-0000";
        const rawStatus = (orderData.status || "Pending").toString().trim();
        const normalizedStatus = rawStatus.toLowerCase();

        // Populate Receipt Details
        if (document.getElementById("display-order-id")) document.getElementById("display-order-id").textContent = `#${currentId}`;
        if (document.getElementById("receipt-name")) document.getElementById("receipt-name").textContent = orderData.customerName || orderData.name || "Customer";
        if (document.getElementById("receipt-phone")) document.getElementById("receipt-phone").textContent = orderData.customerPhone || orderData.phone || "-";
        if (document.getElementById("receipt-dining-type")) document.getElementById("receipt-dining-type").textContent = orderData.orderType === "dine-in" ? "Dine-In" : "Takeaway";
        if (document.getElementById("receipt-table")) document.getElementById("receipt-table").textContent = orderData.tableNumber || orderData.table || "-";
        if (document.getElementById("receipt-payment")) document.getElementById("receipt-payment").textContent = orderData.paymentMethod || "Telebirr";
        if (document.getElementById("receipt-time")) document.getElementById("receipt-time").textContent = orderData.orderDate || new Date().toLocaleString();

        // Phase 7: show the real payment status (Paid / Pending / Failed)
        renderPaymentStatus(orderData, currentId);

        // Populate Items List
        const itemsListContainer = document.getElementById("receipt-items-list");
        if (itemsListContainer && Array.isArray(orderData.items)) {
            let itemsHTML = "";
            orderData.items.forEach((item) => {
                const price = parseFloat(item.price) || 0;
                const qty = parseInt(item.quantity) || 1;
                const itemTotal = (price * qty).toFixed(0);
                const itemName = item.name || item.title || item.foodItem || "Item";
                itemsHTML += `
                    <div class="receipt-item-row" style="display:flex; justify-content:space-between; margin-bottom:8px;">
                        <div>
                            <span class="qty-badge" style="font-weight: bold; color: #ff6b00; margin-right: 6px;">${qty}x</span>
                            <span class="item-title">${itemName}</span>
                        </div>
                        <span class="item-price">${itemTotal} ETB</span>
                    </div>
                `;
            });
            itemsListContainer.innerHTML = itemsHTML;
        }

        // Populate Financial Totals
        const subtotalVal = parseFloat(orderData.subtotal) || parseFloat(orderData.totalAmount) || 0;
        const serviceFeeVal = parseFloat(orderData.serviceFee) || 20;
        const totalVal = parseFloat(orderData.totalAmount) || (subtotalVal + serviceFeeVal);

        if (document.getElementById("receipt-subtotal")) document.getElementById("receipt-subtotal").textContent = subtotalVal.toFixed(0);
        if (document.getElementById("receipt-service-fee")) document.getElementById("receipt-service-fee").textContent = serviceFeeVal.toFixed(0);
        if (document.getElementById("receipt-total")) document.getElementById("receipt-total").textContent = totalVal.toFixed(0);

        // Dynamic UI & Cancel Button Controls
        const cancelWrapper = document.getElementById("cancel-btn-wrapper");
        const timelineSection = document.getElementById("timeline-section");

        if (normalizedStatus === "cancelled") {
            const subtext = document.getElementById("status-subtext");
            const heading = document.getElementById("status-heading");
            const badgeIcon = document.getElementById("status-badge-icon");

            if (subtext) subtext.textContent = "This order was cancelled and will not be prepared.";
            if (heading) heading.textContent = "Order Cancelled";
            if (badgeIcon) badgeIcon.innerHTML = `<i class="fa-solid fa-circle-xmark" style="color: #dc3545; font-size: 2.5rem;"></i>`;

            if (timelineSection) {
                timelineSection.style.opacity = "0.4";
                timelineSection.style.pointerEvents = "none";
            }

            if (cancelWrapper) {
                cancelWrapper.innerHTML = `
                    <button class="btn btn-outline-danger" disabled style="width: 100%; color: #dc3545; border: 1px solid #dc3545; padding: 10px; border-radius: 6px; background: #fde8e8; cursor: not-allowed;">
                        <i class="fa-solid fa-ban"></i> Cancelled
                    </button>
                `;
            }
        } else if (normalizedStatus !== "completed" && normalizedStatus !== "ready") {
            // Show Cancel Button for any active, non-completed order
            if (cancelWrapper) {
                cancelWrapper.innerHTML = `
                    <button class="btn btn-outline-danger" onclick="cancelOrderFromStatusPage('${currentId}')" style="width: 100%; color: #dc3545; border: 1px solid #dc3545; padding: 10px; border-radius: 6px; background: transparent; cursor: pointer; font-weight: 600;">
                        <i class="fa-solid fa-ban"></i> Cancel Order
                    </button>
                `;
            }
        } else if (cancelWrapper) {
            // Completed/Ready state
            cancelWrapper.innerHTML = `
                <button class="btn btn-success" disabled style="width: 100%; color: #155724; border: 1px solid #c3e6cb; padding: 10px; border-radius: 6px; background: #d4edda; cursor: not-allowed;">
                    <i class="fa-solid fa-circle-check"></i> ${rawStatus}
                </button>
            `;
        }
    }

    // 1. Render immediately from localStorage fallback so the page is never blank
    let orderData = null;
    const historyData = JSON.parse(localStorage.getItem("orderHistory")) || [];
    const latestOrder = JSON.parse(localStorage.getItem("latestOrder"));

    if (requestedId) {
        orderData = historyData.find(o => (o.orderId || o.id) === requestedId);
    }
    if (!orderData) {
        orderData = latestOrder;
    }

    renderOrderStatus(orderData);

    // 2. Phase 4 - replace with live MongoDB data when logged in
    if (window.getApiToken() && requestedId) {
        window.getOrderFromApi(requestedId)
            .then(apiOrder => {
                if (apiOrder && (apiOrder.orderId === requestedId || apiOrder.id === requestedId)) {
                    renderOrderStatus(apiOrder);
                    // Keep the local cache in sync for offline rendering
                    localStorage.setItem("latestOrder", JSON.stringify(apiOrder));
                    const hist = JSON.parse(localStorage.getItem("orderHistory")) || [];
                    const exists = hist.some(o => (o.orderId || o.id) === requestedId);
                    if (!exists) hist.unshift(apiOrder);
                    localStorage.setItem("orderHistory", JSON.stringify(hist));
                }
            })
            .catch(() => {
                // stay on localStorage fallback
            });
    }
});