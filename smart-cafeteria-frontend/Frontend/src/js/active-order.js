document.addEventListener("DOMContentLoaded", () => {
    checkActiveOrder();
});

function checkActiveOrder() {
    const activeOrder = JSON.parse(localStorage.getItem("latestOrder"));

    // If no order exists or order is marked as completed, do nothing
    if (!activeOrder || activeOrder.status === "Completed") {
        return;
    }

    // Check if banner already exists to prevent duplicates
    if (document.getElementById("active-order-banner")) {
        return;
    }

    // Create Banner Container
    const banner = document.createElement("div");
    banner.id = "active-order-banner";
    banner.className = "active-order-banner";

    // Inject HTML Content
    banner.innerHTML = `
        <div class="container active-order-container">
            <div class="active-order-info">
                <span class="pulse-dot"></span>
                <i class="fa-solid fa-fire-burner"></i>
                <span>Order <strong>#${activeOrder.orderId}</strong> is currently in progress!</span>
            </div>
            <a href="order-status.html?orderId=${activeOrder.orderId}" class="btn-track-order">
                View Status <i class="fa-solid fa-arrow-right"></i>
            </a>
        </div>
    `;

    // Insert banner at the top of the page (just below navbar or body)
    const navbar = document.querySelector(".navbar");
    if (navbar) {
        navbar.insertAdjacentElement("afterend", banner);
    } else {
        document.body.prepend(banner);
    }
}