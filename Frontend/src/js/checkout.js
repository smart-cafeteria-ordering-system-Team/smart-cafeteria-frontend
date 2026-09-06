document.addEventListener("DOMContentLoaded", () => {

    const CART_KEY = "smart_cafeteria_cart";
    const SERVICE_FEE_ETB = 20;
    const API_BASE_URL = (function() {
        if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
            return window.API_BASE_URL || "http://localhost:5000/api/v1";
        }
        return window.API_BASE_URL || "https://smart-cafeteria-frontend.onrender.com/api/v1";
    })();

    function getApiToken() {
        return localStorage.getItem("auth_token") || localStorage.getItem("token") || "";
    }

    function getCurrentUser() {
        try {
            const raw = localStorage.getItem("current_user");
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    /**
     * Validate if a string is a valid MongoDB ObjectId (24 hex characters)
     */
    function isValidMongoId(id) {
        return typeof id === 'string' && /^[0-9a-f]{24}$/i.test(id);
    }

    /**
     * Sanitize cart items: filter out invalid items and normalize item references
     * Returns { validItems, invalidItems }
     */
    function sanitizeCartItems(cart) {
        const validItems = [];
        const invalidItems = [];

        cart.forEach((item) => {
            const itemId = item.menuItemId || item.id || item.foodItem;
            
            if (!itemId) {
                invalidItems.push({ ...item, reason: 'Missing item ID' });
                return;
            }

            // Check if ID is a valid MongoDB ObjectId
            if (!isValidMongoId(String(itemId))) {
                invalidItems.push({ ...item, reason: `Invalid item ID format: ${itemId}` });
                return;
            }

            validItems.push(item);
        });

        return { validItems, invalidItems };
    }

    /**
     * Convert the localStorage cart state into a persistent order payload
     * and send it to the backend (Phase 4 real database integration).
     */
    async function placeOrderOnServer(payload) {
        const token = getApiToken();
        const headers = { "Content-Type": "application/json", Accept: "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;

        const response = await fetch(`${API_BASE_URL}/orders`, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(payload)
        });

        let data = null;
        try {
            data = await response.json();
        } catch {
            data = null;
        }

        if (!response.ok) {
            const error = new Error(data?.error || data?.message || "Failed to place order");
            error.status = response.status;
            error.data = data;
            throw error;
        }

        return data;
    }

    // Keep order history/status pages instantly usable while live DB data loads.
    function persistLocalOrder(order) {
        if (!order) return;

        const localOrder = {
            orderId: order.orderId || order.id,
            id: order.orderId || order.id,
            orderDate: order.orderDate || new Date().toLocaleString(),
            orderType: order.orderType || "dine-in",
            tableNumber: order.tableNumber || "N/A",
            customerName: order.customerName || "Customer",
            customerPhone: order.customerPhone || "-",
            paymentMethod: order.paymentMethod || "chapa",
            items: order.items || [],
            subtotal: order.subtotal,
            serviceFee: order.serviceFee,
            totalAmount: order.totalAmount,
            status: order.status || "Pending",
            orderTime: order.orderTime,
        };

        localStorage.setItem("latestOrder", JSON.stringify(localOrder));

        const history = JSON.parse(localStorage.getItem("orderHistory")) || [];
        const exists = history.some(o => (o.orderId || o.id) === localOrder.orderId);
        if (!exists) history.unshift(localOrder);
        localStorage.setItem("orderHistory", JSON.stringify(history.slice(0, 30)));
    };

    const checkoutItemsContainer =
        document.getElementById("checkout-items-list");

    const subtotalElement =
        document.getElementById("checkout-subtotal");

    const serviceFeeElement =
        document.getElementById("checkout-service-fee");

    const totalElement =
        document.getElementById("checkout-total");

    const checkoutForm =
        document.getElementById("checkout-form");

    const orderTypeRadios =
        document.querySelectorAll('input[name="orderType"]');

    const tableNumberGroup =
        document.getElementById("table-number-group");

    const tableNumberInput =
        document.getElementById("table-number");

    const paymentCards =
        document.querySelectorAll(".payment-card");

    const radioCards =
        document.querySelectorAll(".radio-card");


    function getCart() {

        try {

            const savedCart =
                localStorage.getItem(CART_KEY);

            if (!savedCart) {
                return [];
            }

            const cart =
                JSON.parse(savedCart);

            return Array.isArray(cart)
                ? cart
                : [];

        } catch (error) {

            console.error(
                "Error reading cart:",
                error
            );

            return [];
        }
    }


    function renderOrderReview() {

        const cart = getCart();

        console.log(
            "Checkout cart:",
            cart
        );


        if (!cart.length) {

            alert(
                "Your cart is empty! Returning to menu."
            );

            window.location.href =
                "menu.html";

            return;
        }


        let itemsHTML = "";
        let subtotal = 0;


        cart.forEach((item) => {

            const itemPrice =
                Number(item.price) || 0;

            const quantity =
                Number(item.quantity) || 1;

            const itemTotal =
                itemPrice * quantity;

            subtotal += itemTotal;


            itemsHTML += `
                <div
                    class="checkout-item-row"
                    style="
                        display:flex;
                        justify-content:space-between;
                        margin-bottom:10px;
                        font-size:0.9rem;
                    "
                >

                    <span>
                        <strong>
                            ${quantity}x
                        </strong>

                        ${escapeHTML(item.name)}
                    </span>

                    <span>
                        <strong>
                            ${itemTotal.toFixed(2)}
                        </strong>
                        ETB
                    </span>

                </div>
            `;

        });


        if (checkoutItemsContainer) {

            checkoutItemsContainer.innerHTML =
                itemsHTML;
        }


        const total =
            subtotal + SERVICE_FEE_ETB;


        if (subtotalElement) {

            subtotalElement.textContent =
                subtotal.toFixed(2);
        }


        if (serviceFeeElement) {

            serviceFeeElement.textContent =
                SERVICE_FEE_ETB.toFixed(2);
        }


        if (totalElement) {

            totalElement.textContent =
                total.toFixed(2);
        }

    }


    function escapeHTML(value) {

        const div =
            document.createElement("div");

        div.textContent =
            value || "";

        return div.innerHTML;
    }


    orderTypeRadios.forEach((radio) => {

        radio.addEventListener(
            "change",
            (event) => {

                radioCards.forEach((card) => {
                    card.classList.remove("active");
                });


                const selectedCard =
                    event.target.closest(".radio-card");


                if (selectedCard) {

                    selectedCard.classList.add(
                        "active"
                    );
                }


                if (
                    event.target.value ===
                    "dine-in"
                ) {

                    if (tableNumberGroup) {
                        tableNumberGroup.style.display =
                            "block";
                    }

                    if (tableNumberInput) {
                        tableNumberInput.required =
                            true;
                    }

                } else {

                    if (tableNumberGroup) {
                        tableNumberGroup.style.display =
                            "none";
                    }

                    if (tableNumberInput) {

                        tableNumberInput.required =
                            false;

                        tableNumberInput.value =
                            "";
                    }
                }

            }
        );

    });


    const paymentRadios =
        document.querySelectorAll(
            'input[name="paymentMethod"]'
        );


    paymentRadios.forEach((radio) => {

        radio.addEventListener(
            "change",
            (event) => {

                paymentCards.forEach((card) => {
                    card.classList.remove("active");
                });


                const selectedCard =
                    event.target.closest(
                        ".payment-card"
                    );


                if (selectedCard) {

                    selectedCard.classList.add(
                        "active"
                    );
                }

            }
        );

    });


    if (checkoutForm) {

        checkoutForm.addEventListener(
            "submit",
            (event) => {

                event.preventDefault();


                const cart =
                    getCart();


                if (!cart.length) {

                    alert(
                        "Your cart is empty."
                    );

                    window.location.href =
                        "menu.html";

                    return;
                }


                // ✅ Guard: every cart item must carry a valid 24-hex MongoDB ObjectId.
                // Stale carts (numeric/static ids) block ordering — sync by reselecting.
                if (
                    cart.some(function (item) {
                        return !isValidMongoId(
                            String(
                                item.menuItemId ||
                                item.id ||
                                item._id
                            )
                        );
                    })
                ) {
                    localStorage.removeItem(CART_KEY);
                    localStorage.removeItem("checkoutCart");
                    window.dispatchEvent(
                        new CustomEvent("cart:updated", { detail: [] })
                    );

                    alert(
                        "Cart updated to sync with live database. Please re-select items from the menu."
                    );

                    window.location.href =
                        "menu.html";

                    return;
                }


                const selectedOrderType =
                    document.querySelector(
                        'input[name="orderType"]:checked'
                    );


                if (!selectedOrderType) {

                    alert(
                        "Please select an order type."
                    );

                    return;
                }


                const orderType =
                    selectedOrderType.value;


                // ✅ Chapa is the only supported payment method.
                const paymentMethod = 'chapa';


                const tableNumber =
                    orderType === "dine-in"
                        ? (
                            tableNumberInput
                                ? tableNumberInput.value.trim()
                                : ""
                        )
                        : "N/A (Takeaway)";


                if (
                    orderType === "dine-in" &&
                    !tableNumber
                ) {

                    alert(
                        "Please enter your table number."
                    );

                    if (tableNumberInput) {
                        tableNumberInput.focus();
                    }

                    return;
                }


                const customerNameElement =
                    document.getElementById(
                        "customer-name"
                    );


                const customerPhoneElement =
                    document.getElementById(
                        "customer-phone"
                    );


                const customerName =
                    customerNameElement
                        ? customerNameElement.value.trim()
                        : "";


                const customerPhone =
                    customerPhoneElement
                        ? customerPhoneElement.value.trim()
                        : "";


                const subtotal =
                    cart.reduce(
                        (sum, item) => {

                            const price =
                                Number(item.price) || 0;

                            const quantity =
                                Number(item.quantity) || 0;

                            return (
                                sum +
                                price * quantity
                            );

                        },
                        0
                    );


                const totalAmount =
                    subtotal + SERVICE_FEE_ETB;


                const placeOrderBtn =
                    document.getElementById("place-order-btn");

                if (placeOrderBtn) {
                    placeOrderBtn.disabled = true;
                    placeOrderBtn.textContent =
                        "Placing Order...";
                }

                // ✅ Sanitize cart items before sending to backend
                const { validItems, invalidItems } = sanitizeCartItems(cart);

                // ✅ If there are invalid items, alert user and clear cart
                if (invalidItems.length > 0) {
                    if (placeOrderBtn) {
                        placeOrderBtn.disabled = false;
                        placeOrderBtn.textContent = "Place Order";
                    }

                    const invalidNames = invalidItems
                        .map(item => `"${item.name}" (${item.reason})`)
                        .join(', ');

                    alert(
                        `The following items are invalid and cannot be ordered:\n${invalidNames}\n\n` +
                        `Please clear your cart and re-add items from the menu.`
                    );

                    // Clear the invalid cart
                    localStorage.removeItem(CART_KEY);
                    localStorage.removeItem("checkoutCart");
                    window.dispatchEvent(
                        new CustomEvent("cart:updated", { detail: [] })
                    );

                    // Redirect to menu to refresh items
                    window.location.href = "menu.html";
                    return;
                }

                const orderPayload = {

                    items:
                        validItems.map((item) => ({
                            menuItemId: String(
                                item.menuItemId || item.id || item._id
                            ),
                            id: String(
                                item.menuItemId || item.id || item._id
                            ),
                            quantity:
                                Number(item.quantity) || 1,
                            notes:
                                item.notes || ""
                        })),

                    customerName:
                        customerName,

                    customerPhone:
                        customerPhone,

                    orderType:
                        orderType,

                    tableNumber:
                        tableNumber,

                    paymentMethod:
                        paymentMethod,

                    totalAmount:
                        totalAmount,

                    notes: ""
                };


                /**
                 * Phase 4: persist the order in MongoDB via the backend.
                 * On success, clear the client cart and redirect to the
                 * order details page displaying the real DB order.
                 */
                placeOrderOnServer(orderPayload)
                    .then(async (result) => {
                        if (placeOrderBtn) {
                            placeOrderBtn.disabled = false;
                            placeOrderBtn.textContent = "Place Order";
                        }

                        const newOrder =
                            result?.order || result;

                        const placedOrderId =
                            String(
                                newOrder?.orderId ||
                                newOrder?.orderNumber ||
                                ""
                            );

                        renderOrderSummaryOnSuccess(newOrder);


                        persistLocalOrder(newOrder);


                        localStorage.removeItem(
                            CART_KEY
                        );


                        localStorage.removeItem(
                            "checkoutCart"
                        );


                        window.dispatchEvent(
                            new CustomEvent("cart:updated", { detail: [] })
                        );


                        // Phase 7: For Chapa online payments, initialize the
                        // gateway checkout and redirect the customer there.
                        if (
                            String(paymentMethod).toLowerCase() === "chapa" &&
                            placedOrderId
                        ) {
                            try {
                                const token = getApiToken();
                                const checkoutRes = await fetch(
                                    `${API_BASE_URL}/payments/checkout`,
                                    {
                                        method: "POST",
                                        headers: {
                                            "Content-Type": "application/json",
                                            Accept: "application/json",
                                            ...(token ? { Authorization: `Bearer ${token}` } : {})
                                        },
                                        body: JSON.stringify({
                                            orderId: placedOrderId,
                                            returnUrl:
                                                window.location.origin +
                                                "/src/pages/customer/order-tracking.html?orderId=" +
                                                encodeURIComponent(placedOrderId)
                                        })
                                    }
                                );
                                const checkoutData = await checkoutRes.json();
                                if (!checkoutRes.ok) {
                                    throw new Error(
                                        checkoutData?.error ||
                                        checkoutData?.message ||
                                        "Failed to initialize payment"
                                    );
                                }
                                const checkoutUrl =
                                    checkoutData?.checkoutUrl ||
                                    checkoutData?.data?.checkoutUrl ||
                                    "";
                                // Remember the real Chapa tx_ref for this order so the
                                // order-tracking page can verify it after payment.
                                const txRef =
                                    checkoutData?.transactionReference ||
                                    checkoutData?.data?.transactionReference ||
                                    "";
                                if (txRef) {
                                    try {
                                        const pending = JSON.parse(localStorage.getItem("pendingChapaVerify")) || {};
                                        pending[placedOrderId] = txRef;
                                        localStorage.setItem("pendingChapaVerify", JSON.stringify(pending));
                                    } catch (e) { /* ignore storage errors */ }
                                }
                                if (checkoutUrl) {
                                    window.location.href = checkoutUrl;
                                    return;
                                }
                                // No checkout URL: fall through to tracking page.
                                window.location.href =
                                    `order-tracking.html?orderId=${encodeURIComponent(placedOrderId)}`;
                            } catch (initError) {
                                let initMsg = initError.message || "Please try again.";
                                if (String(initMsg).indexOf("[object Object]") !== -1) {
                                    initMsg = "Could not start Chapa payment. This usually means the customer email is not accepted by Chapa (use a real Gmail address). Contact the cafeteria for help.";
                                }
                                alert("Payment link could not be created: " + initMsg);
                                window.location.href =
                                    `order-tracking.html?orderId=${encodeURIComponent(placedOrderId)}`;
                            }
                            return;
                        }


                        window.location.href =
                            `order-tracking.html?orderId=${encodeURIComponent(placedOrderId)}`;

                    })
                    .catch((error) => {

                        if (placeOrderBtn) {
                            placeOrderBtn.disabled = false;
                            placeOrderBtn.textContent =
                                "Place Order";
                        }

                        if (error.status === 401) {
                            alert("Please login to place your order.");
                            window.location.href = "../common/login.html";
                            return;
                        }

                        alert(
                            error.message ||
                            "Failed to place order. Please try again."
                        );

                    });


                function renderOrderSummaryOnSuccess(newOrder) {

                    try {

                        if (!newOrder) return;

                        const reviewItems =
                            document.getElementById(
                                "checkout-items-list"
                            );

                        const rawStatus =
                            newOrder.status || "pending";

                        const displayStatus =
                            rawStatus.charAt(0).toUpperCase() +
                            rawStatus.slice(1);

                        if (reviewItems) {

                            reviewItems.innerHTML =
                                `
                                <div class="checkout-success-note"
                                     style="text-align:center; padding:12px; background:#f0fdf4; border:1px solid #86efac; border-radius:8px; margin-bottom:10px;">
                                    <strong style="color:#15803d;">
                                        <i class="fa-solid fa-circle-check"></i>
                                        Order #${escapeHTML(newOrder.orderId || newOrder.orderNumber || "")} placed!
                                    </strong>
                                </div>
                            `;

                        }

                        if (subtotalElement) {

                            subtotalElement.textContent =
                                Number(newOrder.subtotal || 0).toFixed(2);
                        }


                        if (serviceFeeElement) {

                            serviceFeeElement.textContent =
                                Number(newOrder.serviceFee || 0).toFixed(2);
                        }


                        if (totalElement) {

                            totalElement.textContent =
                                Number(newOrder.totalAmount || 0).toFixed(2);
                        }

                    } catch (err) {

                        console.warn("Order summary render warning:", err);

                    }

                }

            }
        );

    }


    renderOrderReview();

});