document.addEventListener("DOMContentLoaded", () => {

    // ============================================================
    // SMART CAFETERIA - CART SYSTEM
    // ============================================================

    // ------------------------------------------------------------
    // 1. DOM ELEMENTS
    // ------------------------------------------------------------

    const cartContainer = document.getElementById("cart-container");

    // Main cart count
    const cartCountElement = document.getElementById("cart-count");

    // Other possible cart badges used in the project
    const cartBadgeElement = document.getElementById("cart-badge-count");
    const mobileCartBadgeElement = document.getElementById("mobile-cart-badge");

    // Summary elements
    const subtotalElement = document.getElementById("summary-subtotal");
    const serviceFeeElement = document.getElementById("summary-service-fee");
    const totalElement = document.getElementById("summary-total");

    // Buttons
    const checkoutBtn = document.getElementById("checkout-btn");
    const clearCartBtn = document.getElementById("clear-cart-btn");

    // Fixed service / packaging fee
    const SERVICE_FEE_ETB = 20;


    // ============================================================
    // 2. GET CART FROM LOCAL STORAGE
    // ============================================================

    function getCart() {

        try {

            const savedCart = localStorage.getItem("cart");

            if (!savedCart) {
                return [];
            }

            const cart = JSON.parse(savedCart);

            if (!Array.isArray(cart)) {
                return [];
            }

            return cart.map(item => ({
                ...item,
                quantity: Math.max(1, parseInt(item.quantity) || 1),
                price: parseFloat(item.price) || 0
            }));

        } catch (error) {

            console.error("Error loading cart:", error);

            return [];
        }
    }


    // ============================================================
    // 3. SAVE CART TO LOCAL STORAGE
    // ============================================================

    function saveCart(cart) {

        try {

            localStorage.setItem("cart", JSON.stringify(cart));

            // Re-render cart immediately
            renderCart();

        } catch (error) {

            console.error("Error saving cart:", error);

        }
    }


    // ============================================================
    // 4. UPDATE ALL CART BADGES
    // ============================================================

    function updateCartCount(cart) {

        const totalItems = cart.reduce((total, item) => {

            return total + (parseInt(item.quantity) || 0);

        }, 0);


        // Main cart count
        if (cartCountElement) {
            cartCountElement.textContent = totalItems;
        }


        // Navbar cart badge
        if (cartBadgeElement) {
            cartBadgeElement.textContent = totalItems;
        }


        // Mobile floating cart badge
        if (mobileCartBadgeElement) {
            mobileCartBadgeElement.textContent = totalItems;
        }


        // Also update any other elements using these classes
        document.querySelectorAll(".cart-count").forEach(element => {
            element.textContent = totalItems;
        });

        document.querySelectorAll(".cart-badge").forEach(element => {
            element.textContent = totalItems;
        });

        document.querySelectorAll(".floating-cart-count").forEach(element => {
            element.textContent = totalItems;
        });
    }


    // ============================================================
    // 5. UPDATE SUMMARY
    // ============================================================

    function updateSummary(subtotal) {

        const serviceFee = subtotal > 0 ? SERVICE_FEE_ETB : 0;

        const total = subtotal + serviceFee;


        if (subtotalElement) {
            subtotalElement.textContent = subtotal.toFixed(0);
        }


        if (serviceFeeElement) {
            serviceFeeElement.textContent = serviceFee.toFixed(0);
        }


        if (totalElement) {
            totalElement.textContent = total.toFixed(0);
        }


        return {
            subtotal,
            serviceFee,
            total
        };
    }


    // ============================================================
    // 6. RENDER EMPTY CART
    // ============================================================

    function renderEmptyCart() {

        if (!cartContainer) {
            return;
        }


        cartContainer.innerHTML = `

            <div class="empty-cart">

                <i class="fa-solid fa-basket-shopping empty-icon"></i>

                <h3>Your cart is empty</h3>

                <p>
                    Looks like you haven't added any
                    Ethiopian delicacies to your cart yet.
                </p>

                <a href="menu.html" class="btn btn-primary">
                    <i class="fa-solid fa-utensils"></i>
                    Explore Menu
                </a>

            </div>

        `;


        updateSummary(0);


        if (checkoutBtn) {
            checkoutBtn.disabled = true;
            checkoutBtn.classList.add("disabled");
        }


        if (clearCartBtn) {
            clearCartBtn.style.display = "none";
        }
    }


    // ============================================================
    // 7. CREATE CART ITEM HTML
    // ============================================================

    function createCartItem(item) {

        const itemPrice = parseFloat(item.price) || 0;

        const quantity = parseInt(item.quantity) || 1;

        const itemTotal = itemPrice * quantity;


        // Optional food image
        let imageHTML = "";

        if (item.image) {

            imageHTML = `

                <div class="cart-item-image">

                    <img
                        src="${item.image}"
                        alt="${escapeHTML(item.name)}"
                        onerror="this.style.display='none'"
                    >

                </div>

            `;

        }


        return `

            <div
                class="cart-item-card"
                data-id="${escapeHTML(String(item.id))}"
            >

                ${imageHTML}


                <div class="cart-item-info">

                    <h4 class="cart-item-title">
                        ${escapeHTML(item.name || "Food Item")}
                    </h4>

                    <p class="cart-item-price">
                        ${itemPrice.toFixed(0)}
                        <small>ETB</small>
                    </p>

                </div>


                <div class="cart-item-controls">


                    <!-- Quantity Controller -->

                    <div class="qty-control">

                        <button
                            type="button"
                            class="btn-qty decrease-btn"
                            data-id="${escapeHTML(String(item.id))}"
                            aria-label="Decrease quantity"
                        >

                            <i class="fa-solid fa-minus"></i>

                        </button>


                        <span class="qty-value">
                            ${quantity}
                        </span>


                        <button
                            type="button"
                            class="btn-qty increase-btn"
                            data-id="${escapeHTML(String(item.id))}"
                            aria-label="Increase quantity"
                        >

                            <i class="fa-solid fa-plus"></i>

                        </button>

                    </div>


                    <!-- Item Total -->

                    <div class="item-total-price">

                        <strong>
                            ${itemTotal.toFixed(0)}
                        </strong>

                        <small>ETB</small>

                    </div>


                    <!-- Remove -->

                    <button
                        type="button"
                        class="btn-remove remove-btn"
                        data-id="${escapeHTML(String(item.id))}"
                        title="Remove Item"
                        aria-label="Remove ${escapeHTML(item.name || "item")}"
                    >

                        <i class="fa-solid fa-trash-can"></i>

                    </button>

                </div>

            </div>

        `;
    }


    // ============================================================
    // 8. RENDER CART
    // ============================================================

    function renderCart() {

        const cart = getCart();


        // Always update badge
        updateCartCount(cart);


        // If cart container doesn't exist
        if (!cartContainer) {

            console.warn(
                "Cart container (#cart-container) was not found."
            );

            return;
        }


        // Empty cart
        if (cart.length === 0) {

            renderEmptyCart();

            return;
        }


        // Cart has items
        if (clearCartBtn) {
            clearCartBtn.style.display = "inline-block";
        }


        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.classList.remove("disabled");
        }


        let cartHTML = "";

        let subtotal = 0;


        cart.forEach(item => {

            const price = parseFloat(item.price) || 0;

            const quantity = parseInt(item.quantity) || 1;

            subtotal += price * quantity;

            cartHTML += createCartItem(item);

        });


        cartContainer.innerHTML = cartHTML;


        // Update prices
        updateSummary(subtotal);


        // Attach buttons
        attachEventListeners();
    }


    // ============================================================
    // 9. CHANGE QUANTITY
    // ============================================================

    function changeQuantity(id, delta) {

        let cart = getCart();


        const item = cart.find(
            item => String(item.id) === String(id)
        );


        if (!item) {
            return;
        }


        item.quantity = (parseInt(item.quantity) || 1) + delta;


        // Remove item when quantity becomes zero
        if (item.quantity <= 0) {

            cart = cart.filter(
                item => String(item.id) !== String(id)
            );

        }


        saveCart(cart);
    }


    // ============================================================
    // 10. REMOVE ONE ITEM
    // ============================================================

    function removeItem(id) {

        let cart = getCart();


        cart = cart.filter(
            item => String(item.id) !== String(id)
        );


        saveCart(cart);
    }


    // ============================================================
    // 11. CLEAR ENTIRE CART
    // ============================================================

    function clearCart() {

        const cart = getCart();


        if (cart.length === 0) {
            return;
        }


        const confirmed = confirm(
            "Are you sure you want to remove all items from your cart?"
        );


        if (!confirmed) {
            return;
        }


        localStorage.removeItem("cart");


        renderCart();
    }


    // ============================================================
    // 12. CHECKOUT
    // ============================================================

    function goToCheckout() {

        const cart = getCart();


        if (cart.length === 0) {

            alert("Your cart is empty. Please add food items first.");

            return;
        }


        window.location.href = "checkout.html";
    }


    // ============================================================
    // 13. EVENT LISTENERS
    // ============================================================

    function attachEventListeners() {


        // --------------------------------------------------------
        // Increase Quantity
        // --------------------------------------------------------

        document.querySelectorAll(".increase-btn").forEach(button => {

            button.addEventListener("click", function () {

                const id = this.dataset.id;

                changeQuantity(id, 1);

            });

        });


        // --------------------------------------------------------
        // Decrease Quantity
        // --------------------------------------------------------

        document.querySelectorAll(".decrease-btn").forEach(button => {

            button.addEventListener("click", function () {

                const id = this.dataset.id;

                changeQuantity(id, -1);

            });

        });


        // --------------------------------------------------------
        // Remove Item
        // --------------------------------------------------------

        document.querySelectorAll(".remove-btn").forEach(button => {

            button.addEventListener("click", function () {

                const id = this.dataset.id;

                removeItem(id);

            });

        });

    }


    // ============================================================
    // 14. CLEAR CART BUTTON
    // ============================================================

    if (clearCartBtn) {

        clearCartBtn.addEventListener("click", clearCart);

    }


    // ============================================================
    // 15. CHECKOUT BUTTON
    // ============================================================

    if (checkoutBtn) {

        checkoutBtn.addEventListener("click", goToCheckout);

    }


    // ============================================================
    // 16. SYNCHRONIZE CART BETWEEN PAGES
    // ============================================================

    window.addEventListener("storage", function (event) {

        if (event.key === "cart") {

            renderCart();

        }

    });


    // ============================================================
    // 17. ESCAPE HTML
    // Prevent HTML injection from food names
    // ============================================================

    function escapeHTML(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    // ============================================================
    // 18. INITIALIZE CART
    // ============================================================

    renderCart();

});