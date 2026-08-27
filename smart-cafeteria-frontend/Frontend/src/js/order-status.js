/**
 * Attached to window object for live cancellation from status receipt page
 */
window.cancelOrderFromStatusPage = function(orderId) {
    if (!confirm(`Are you sure you want to cancel order #${orderId}?`)) {
        return;
    }

    let latestOrder = JSON.parse(localStorage.getItem("latestOrder"));
    let historyData = JSON.parse(localStorage.getItem("orderHistory")) || [];

    // 1. Update latest order if ID matches
    if (latestOrder) {
        const latestId = latestOrder.orderId || latestOrder.id;
        if (!latestId || latestId === orderId) {
            latestOrder.status = "Cancelled";
            localStorage.setItem("latestOrder", JSON.stringify(latestOrder));
        }
    }

    // 2. Update history array
    let orderFound = false;
    historyData = historyData.map(order => {
        const id = order.orderId || order.id;
        if (id === orderId) {
            order.status = "Cancelled";
            orderFound = true;
        }
        return order;
    });

    if (orderFound || latestOrder) {
        localStorage.setItem("orderHistory", JSON.stringify(historyData));
        alert(`Order #${orderId} has been successfully cancelled.`);
        location.reload();
    } else {
        alert("Unable to find order to cancel.");
    }
};

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const requestedId = urlParams.get("orderId");

    let orderData = null;
    let historyData = JSON.parse(localStorage.getItem("orderHistory")) || [];
    let latestOrder = JSON.parse(localStorage.getItem("latestOrder"));

    // Retrieve requested order or default to latest order
    if (requestedId) {
        orderData = historyData.find(o => (o.orderId || o.id) === requestedId);
    }
    
    if (!orderData) {
        orderData = latestOrder;
    }

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

    // Populate Items List
    const itemsListContainer = document.getElementById("receipt-items-list");
    if (itemsListContainer && Array.isArray(orderData.items)) {
        let itemsHTML = "";
        orderData.items.forEach((item) => {
            const price = parseFloat(item.price) || 0;
            const qty = parseInt(item.quantity) || 1;
            const itemTotal = (price * qty).toFixed(0);
            itemsHTML += `
                <div class="receipt-item-row" style="display:flex; justify-content:space-between; margin-bottom:8px;">
                    <div>
                        <span class="qty-badge" style="font-weight: bold; color: #ff6b00; margin-right: 6px;">${qty}x</span>
                        <span class="item-title">${item.name}</span>
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
     else if (cancelWrapper) {
    
    cancelWrapper.innerHTML = `
        <a href="feedback.html?orderId=${currentId}" class="btn btn-success" style="display: block; width: 100%; text-align: center; color: #fff; background: #10b981; padding: 10px; border-radius: 6px; text-decoration: none; font-weight: 600;">
            <i class="fa-solid fa-star"></i> Leave Feedback for #${currentId}
        </a>
    `;
}
});