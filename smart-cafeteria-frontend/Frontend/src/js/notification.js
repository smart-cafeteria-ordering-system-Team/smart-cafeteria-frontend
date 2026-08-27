document.addEventListener("DOMContentLoaded", () => {
    const notificationsContainer = document.getElementById("notifications-container");
    const markAllReadBtn = document.getElementById("mark-all-read-btn");
    const clearAllBtn = document.getElementById("clear-notifications-btn");

    // Sample default notifications if none exist in localStorage
    const defaultNotifications = [
        {
            id: "notif-1",
            title: "Order #TE-1042 Prepared!",
            message: "Your Kitfo and Macchiato order is ready for pick-up at Table 04.",
            timestamp: "10 mins ago",
            type: "order", // 'order', 'promo', 'system'
            read: false
        },
        {
            id: "notif-2",
            title: "Special Offer Today!",
            message: "Enjoy a 15% discount on all coffee and pastries between 2:00 PM - 4:00 PM.",
            timestamp: "2 hours ago",
            type: "promo",
            read: false
        },
        {
            id: "notif-3",
            title: "Profile Updated",
            message: "Your primary phone number was successfully updated.",
            timestamp: "1 day ago",
            type: "system",
            read: true
        }
    ];

    // 1. Get Notifications from LocalStorage
    function getNotifications() {
        const saved = localStorage.getItem("userNotifications");
        if (!saved) {
            localStorage.setItem("userNotifications", JSON.stringify(defaultNotifications));
            return defaultNotifications;
        }
        return JSON.parse(saved);
    }

    // 2. Render Notifications to UI
    function renderNotifications() {
        const list = getNotifications();

        if (list.length === 0) {
            notificationsContainer.innerHTML = `
                <div class="empty-state-card">
                    <i class="fa-regular fa-bell-slash empty-icon"></i>
                    <h3>No Notifications</h3>
                    <p>You have no recent alerts or order updates right now.</p>
                </div>
            `;
            return;
        }

        let html = "";
        list.forEach(item => {
            const unreadClass = item.read ? "" : "unread";
            
            // Set Icon based on notification type
            let iconClass = "fa-bell";
            let iconBg = "icon-system";
            if (item.type === "order") {
                iconClass = "fa-utensils";
                iconBg = "icon-order";
            } else if (item.type === "promo") {
                iconClass = "fa-tags";
                iconBg = "icon-promo";
            }

            html += `
                <div class="notification-item ${unreadClass}" data-id="${item.id}">
                    <div class="notification-icon ${iconBg}">
                        <i class="fa-solid ${iconClass}"></i>
                    </div>
                    <div class="notification-body">
                        <div class="notification-title-row">
                            <h4>${item.title}</h4>
                            <span class="notification-time">${item.timestamp}</span>
                        </div>
                        <p>${item.message}</p>
                    </div>
                    <button class="delete-notif-btn" data-id="${item.id}" title="Remove">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            `;
        });

        notificationsContainer.innerHTML = html;
        attachEventListeners();
    }

    // 3. Action Event Listeners
    function attachEventListeners() {
        // Mark individual item as read when clicked
        document.querySelectorAll(".notification-item").forEach(item => {
            item.addEventListener("click", (e) => {
                if (e.target.closest(".delete-notif-btn")) return; // Skip if deleting

                const id = item.getAttribute("data-id");
                markAsRead(id);
            });
        });

        // Delete single notification
        document.querySelectorAll(".delete-notif-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const id = btn.getAttribute("data-id");
                deleteNotification(id);
            });
        });
    }

    // Helper: Mark single notification read
    function markAsRead(id) {
        let list = getNotifications();
        list = list.map(item => item.id === id ? { ...item, read: true } : item);
        localStorage.setItem("userNotifications", JSON.stringify(list));
        renderNotifications();
    }

    // Helper: Delete single notification
    function deleteNotification(id) {
        let list = getNotifications();
        list = list.filter(item => item.id !== id);
        localStorage.setItem("userNotifications", JSON.stringify(list));
        renderNotifications();
    }

    // Mark All as Read Button
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener("click", () => {
            let list = getNotifications();
            list = list.map(item => ({ ...item, read: true }));
            localStorage.setItem("userNotifications", JSON.stringify(list));
            renderNotifications();
        });
    }

    // Clear All Notifications Button
    if (clearAllBtn) {
        clearAllBtn.addEventListener("click", () => {
            if (confirm("Are you sure you want to clear all notifications?")) {
                localStorage.setItem("userNotifications", JSON.stringify([]));
                renderNotifications();
            }
        });
    }

    // Initial Load
    renderNotifications();
});