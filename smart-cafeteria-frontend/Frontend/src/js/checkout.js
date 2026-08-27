document.addEventListener("DOMContentLoaded", () => {
    // 1. DOM Elements
    const checkoutItemsContainer = document.getElementById("checkout-items-list");
    const subtotalElement = document.getElementById("checkout-subtotal");
    const serviceFeeElement = document.getElementById("checkout-service-fee");
    const totalElement = document.getElementById("checkout-total");
    const checkoutForm = document.getElementById("checkout-form");
    const orderTypeRadios = document.querySelectorAll('input[name="orderType"]');
    const tableNumberGroup = document.getElementById("table-number-group");
    const tableNumberInput = document.getElementById("table-number");
    const paymentCards = document.querySelectorAll(".payment-card");
    const radioCards = document.querySelectorAll(".radio-card");

    const SERVICE_FEE_ETB = 20;

    // 2. Load Cart Data
    function getCart() {
        return JSON.parse(localStorage.getItem("cart")) || [];
    }

    // 3. Render Order Summary Preview
    function renderOrderReview() {
        const cart = getCart();

        // Redirect if cart is empty
        if (cart.length === 0) {
            alert("Your cart is empty! Returning to menu.");
            window.location.href = "menu.html";
            return;
        }

        let itemsHTML = "";
        let subtotal = 0;

        cart.forEach((item) => {
            const itemPrice = parseFloat(item.price);
            const itemTotal = itemPrice * item.quantity;
            subtotal += itemTotal;

            itemsHTML += `
                <div class="checkout-item-row" style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem;">
                    <span><strong>${item.quantity}x</strong> ${item.name}</span>
                    <span><strong>${itemTotal}</strong> ETB</span>
                </div>
            `;
        });

        checkoutItemsContainer.innerHTML = itemsHTML;

        const total = subtotal + SERVICE_FEE_ETB;
        subtotalElement.textContent = subtotal.toFixed(0);
        serviceFeeElement.textContent = SERVICE_FEE_ETB.toFixed(0);
        totalElement.textContent = total.toFixed(0);
    }

    // 4. Toggle Table Number Input Based on Order Type (Dine-in vs Takeaway)
    orderTypeRadios.forEach((radio) => {
        radio.addEventListener("change", (e) => {
            // Update Active UI State
            radioCards.forEach(card => card.classList.remove("active"));
            e.target.closest(".radio-card").classList.add("active");

            if (e.target.value === "dine-in") {
                tableNumberGroup.style.display = "block";
                tableNumberInput.required = true;
            } else {
                tableNumberGroup.style.display = "none";
                tableNumberInput.required = false;
                tableNumberInput.value = "";
            }
        });
    });

    // 5. Payment Selection UI Styling
    const paymentRadios = document.querySelectorAll('input[name="paymentMethod"]');
    paymentRadios.forEach((radio) => {
        radio.addEventListener("change", (e) => {
            paymentCards.forEach(card => card.classList.remove("active"));
            e.target.closest(".payment-card").classList.add("active");
        });
    });

    // 6. Handle Form Submission (Place Order)
    checkoutForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const cart = getCart();
        if (cart.length === 0) return;

        // Collect Form Data
        const orderType = document.querySelector('input[name="orderType"]:checked').value;
        const tableNumber = orderType === "dine-in" ? tableNumberInput.value : "N/A (Takeaway)";
        const customerName = document.getElementById("customer-name").value.trim();
        const customerPhone = document.getElementById("customer-phone").value.trim();
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const totalAmount = subtotal + SERVICE_FEE_ETB;

        // Generate Unique Order ID (e.g. ET-8392)
        const orderId = "ET-" + Math.floor(1000 + Math.random() * 9000);

        // Build Order Object
        const newOrder = {
            orderId: orderId,
            orderDate: new Date().toLocaleString(),
            orderType: orderType,
            tableNumber: tableNumber,
            customerName: customerName,
            customerPhone: customerPhone,
            paymentMethod: paymentMethod,
            items: cart,
            subtotal: subtotal,
            serviceFee: SERVICE_FEE_ETB,
            totalAmount: totalAmount,
            status: "Received" // Default tracking state
        };

        // Save order details to localStorage for the order-status.html page
        localStorage.setItem("latestOrder", JSON.stringify(newOrder));

        // Clear cart
        localStorage.removeItem("cart");

        // Redirect to Order Confirmation Page
        window.location.href = `order-tracking.html?orderId=${orderId}`;
    });

    // Initial render call
    renderOrderReview();
});