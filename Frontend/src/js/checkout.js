document.addEventListener("DOMContentLoaded", () => {

    const CART_KEY = "smart_cafeteria_cart";
    const SERVICE_FEE_ETB = 20;

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


                const selectedOrderType =
                    document.querySelector(
                        'input[name="orderType"]:checked'
                    );


                const selectedPaymentMethod =
                    document.querySelector(
                        'input[name="paymentMethod"]:checked'
                    );


                if (!selectedOrderType) {

                    alert(
                        "Please select an order type."
                    );

                    return;
                }


                if (!selectedPaymentMethod) {

                    alert(
                        "Please select a payment method."
                    );

                    return;
                }


                const orderType =
                    selectedOrderType.value;


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


                const paymentMethod =
                    selectedPaymentMethod.value;


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


                const orderId =
                    "ET-" +
                    Math.floor(
                        1000 +
                        Math.random() * 9000
                    );


                const newOrder = {

                    orderId: orderId,

                    orderDate:
                        new Date().toLocaleString(),

                    orderType:
                        orderType,

                    tableNumber:
                        tableNumber,

                    customerName:
                        customerName,

                    customerPhone:
                        customerPhone,

                    paymentMethod:
                        paymentMethod,

                    items:
                        cart,

                    subtotal:
                        subtotal,

                    serviceFee:
                        SERVICE_FEE_ETB,

                    totalAmount:
                        totalAmount,

                    status:
                        "Received"
                };


                localStorage.setItem(
                    "latestOrder",
                    JSON.stringify(newOrder)
                );


                localStorage.removeItem(
                    CART_KEY
                );


                localStorage.removeItem(
                    "checkoutCart"
                );


                window.dispatchEvent(
                    new CustomEvent(
                        "cart:updated"
                    )
                );


                window.location.href =
                    `order-tracking.html?orderId=${encodeURIComponent(orderId)}`;

            }
        );

    }


    renderOrderReview();

});