/**
 * Attached to window so that HTML onclick="cancelOrder('ID')" works without scope issues
 */
window.cancelOrder = function(orderId) {
    if (!confirm(`Are you sure you want to cancel order #${orderId}?`)) {
        return;
    }

    let historyData = JSON.parse(localStorage.getItem("orderHistory")) || [];
    let latestOrder = JSON.parse(localStorage.getItem("latestOrder"));
    let isUpdated = false;

    // 1. Update status in orderHistory list
    historyData = historyData.map(order => {
        const id = order.orderId || order.id;
        if (id === orderId) {
            if (order.status === "Completed") {
                alert("Cannot cancel an order that has already been completed.");
                return order;
            }
            order.status = "Cancelled";
            isUpdated = true;
        }
        return order;
    });

    // 2. Update status in latestOrder if IDs match
    if (latestOrder) {
        const latestId = latestOrder.orderId || latestOrder.id;
        if (latestId === orderId) {
            latestOrder.status = "Cancelled";
            localStorage.setItem("latestOrder", JSON.stringify(latestOrder));
            isUpdated = true;
        }
    }

    if (isUpdated) {
        localStorage.setItem("orderHistory", JSON.stringify(historyData));
        alert(`Order #${orderId} was successfully cancelled.`);
        location.reload();
    } else {
        alert("Order could not be found or cancelled.");
    }
};

document.addEventListener("DOMContentLoaded", () => {
    const historyListContainer = document.getElementById("orders-history-list");
    const filterTabs = document.querySelectorAll(".history-tab");
    const clearHistoryBtn = document.getElementById("clear-history-btn");

    function getOrdersArray() {
        let historyData = JSON.parse(localStorage.getItem("orderHistory")) || [];
        const singleOrder = JSON.parse(localStorage.getItem("latestOrder"));

        if (singleOrder) {
            const singleId = singleOrder.orderId || singleOrder.id;
            const exists = historyData.some(o => (o.orderId || o.id) === singleId);
            if (!exists) {
                historyData.unshift(singleOrder);
            } else {
                historyData = historyData.map(o => {
                    if ((o.orderId || o.id) === singleId) {
                        return singleOrder;
                    }
                    return o;
                });
            }
        }

        return historyData;
    }

    function renderOrders(filterStatus = "all") {
        const orders = getOrdersArray();

        if (!historyListContainer) return;

        if (orders.length === 0) {
            historyListContainer.innerHTML = `
                <div class="empty-history-card" style="text-align: center; padding: 40px; background: #fff; border-radius: 8px;">
                    <i class="fa-solid fa-receipt" style="font-size: 3rem; color: #9ca3af; margin-bottom: 12px;"></i>
                    <h3>No Past Orders Found</h3>
                    <p>You haven't placed any food orders yet.</p>
                    <a href="menu.html" class="btn btn-primary" style="margin-top: 12px; display: inline-block;">Browse Menu</a>
                </div>
            `;
            return;
        }

        const filteredOrders = filterStatus === "all" 
            ? orders 
            : orders.filter(order => {
                const currentStatus = order.status || "Pending";
                if (filterStatus === "Completed") return currentStatus === "Completed";
                if (filterStatus === "Pending") return currentStatus === "Pending" || currentStatus === "In Progress";
                if (filterStatus === "Cancelled") return currentStatus === "Cancelled";
                return true;
            });

        if (filteredOrders.length === 0) {
            historyListContainer.innerHTML = `
                <div class="empty-history-card" style="text-align: center; padding: 30px; background: #fff; border-radius: 8px;">
                    <p>No orders found under "${filterStatus}".</p>
                </div>
            `;
            return;
        }

        let html = "";
        filteredOrders.forEach((order) => {
            const id = order.orderId || order.id || "ET-0000";
            const status = order.status || "Pending";
            
            let statusClass = "status-tag-progress";
            if (status === "Completed") statusClass = "status-tag-completed";
            if (status === "Cancelled") statusClass = "status-tag-cancelled";

            const items = order.items || [];
            const itemPills = items.map(item => `
                <span class="history-item-pill" style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 0.85rem; margin-right: 6px; display: inline-block; margin-bottom: 4px;">
                    <strong>${item.quantity}x</strong> ${item.name}
                </span>
            `).join("");

            // Show Cancel Button ONLY for active orders
            const canCancel = (status === "Pending" || status === "In Progress");
            const cancelButton = canCancel ? `
                <button class="btn btn-outline-danger btn-sm" onclick="cancelOrder('${id}')" style="color: #dc3545; border: 1px solid #dc3545; background: transparent; padding: 6px 12px; border-radius: 6px; cursor: pointer;">
                    <i class="fa-solid fa-ban"></i> Cancel Order
                </button>
            ` : "";

            html += `
                <div class="order-history-card" style="background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; margin-bottom: 16px;">
                    <div class="card-top-row" style="display: flex; justify-content: space-between; align-items: center;">
                        <div class="order-id-date">
                            <strong class="order-number" style="font-size: 1.1rem;">#${id}</strong>
                            <small class="order-date" style="margin-left: 10px; color: #6b7280;"><i class="fa-solid fa-calendar-day"></i> ${order.orderDate || "Today"}</small>
                        </div>
                        <span class="status-tag ${statusClass}" style="padding: 4px 10px; border-radius: 20px; font-weight: 600; font-size: 0.85rem; ${status === 'Cancelled' ? 'background: #fde8e8; color: #f05252;' : ''}">${status}</span>
                    </div>

                    <div class="card-middle-row" style="margin: 12px 0;">
                        <div class="order-items-preview">
                            ${itemPills}
                        </div>
                        <div class="order-total-price" style="margin-top: 8px; font-size: 1rem;">
                            <small style="color: #6b7280;">Total:</small>
                            <strong>${order.totalAmount || 0} ETB</strong>
                        </div>
                    </div>

                    <div class="card-bottom-row" style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f3f4f6; padding-top: 12px;">
                        <span class="table-info" style="color: #4b5563;">
                            <i class="fa-solid fa-utensils"></i> ${order.orderType === "dine-in" ? `Table ${order.tableNumber || '-'}` : "Takeaway"}
                        </span>
                        <div class="action-buttons" style="display: flex; gap: 8px;">
                            <a href="order-status.html?orderId=${id}" class="btn btn-secondary btn-sm" style="background: #f3f4f6; color: #374151; padding: 6px 12px; border-radius: 6px; text-decoration: none;">
                                <i class="fa-solid fa-eye"></i> Details
                            </a>
                            ${cancelButton}
                        </div>
                    </div>
                </div>
            `;
        });

        historyListContainer.innerHTML = html;
    }

    // Filter Buttons Listener
    filterTabs.forEach(tab => {
        tab.addEventListener("click", (e) => {
            filterTabs.forEach(t => t.classList.remove("active"));
            e.target.classList.add("active");
            renderOrders(e.target.getAttribute("data-filter"));
        });
    });

    // Clear History Listener
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener("click", () => {
            if (confirm("Are you sure you want to clear your entire order history?")) {
                localStorage.removeItem("orderHistory");
                localStorage.removeItem("latestOrder");
                renderOrders();
            }
        });
    }

    renderOrders();
});