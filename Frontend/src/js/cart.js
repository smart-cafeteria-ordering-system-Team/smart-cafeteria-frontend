const CART_KEY = "smart_cafeteria_cart";
const CHECKOUT_KEY = "checkoutCart";

document.addEventListener("DOMContentLoaded", function () {

    const cartContainer = document.getElementById("cart-container");
    const navbarCartCount = document.getElementById("navbar-cart-count");
    const itemsCartCount = document.getElementById("items-cart-count");

    const clearCartBtn = document.getElementById("clear-cart-btn");
    const checkoutBtn = document.getElementById("checkout-btn");

    const subtotalElement = document.getElementById("summary-subtotal");
    const serviceFeeElement = document.getElementById("summary-service-fee");
    const totalElement = document.getElementById("summary-total");


    function getCart() {
        try {
            const savedCart = localStorage.getItem(CART_KEY);

            if (!savedCart) {
                return [];
            }

            const cart = JSON.parse(savedCart);

            return Array.isArray(cart) ? cart : [];

        } catch (error) {
            console.error("Error reading cart:", error);
            return [];
        }
    }


    function saveCart(cart) {
        localStorage.setItem(
            CART_KEY,
            JSON.stringify(cart)
        );

        window.dispatchEvent(
            new CustomEvent("cart:updated")
        );
    }


    function updateCart() {

        const cart = getCart();

        let totalQuantity = 0;
        let subtotal = 0;

        cart.forEach(function (item) {

            const quantity = Number(item.quantity) || 0;
            const price = Number(item.price) || 0;

            totalQuantity += quantity;
            subtotal += price * quantity;

        });

        const serviceFee = 0;
        const total = subtotal + serviceFee;


        if (navbarCartCount) {
            navbarCartCount.textContent = totalQuantity;
        }

        if (itemsCartCount) {
            itemsCartCount.textContent = totalQuantity;
        }

        if (subtotalElement) {
            subtotalElement.textContent = subtotal.toFixed(2);
        }

        if (serviceFeeElement) {
            serviceFeeElement.textContent = serviceFee.toFixed(2);
        }

        if (totalElement) {
            totalElement.textContent = total.toFixed(2);
        }


        if (clearCartBtn) {
            clearCartBtn.style.display =
                cart.length > 0 ? "inline-flex" : "none";
        }


        if (checkoutBtn) {
            checkoutBtn.disabled = cart.length === 0;
        }


        renderCart(cart);
    }


    function renderCart(cart) {

        if (!cartContainer) {
            return;
        }


        if (cart.length === 0) {

            cartContainer.innerHTML = `
                <div class="empty-cart">

                    <div class="empty-icon">
                        <i class="fa-solid fa-cart-shopping"></i>
                    </div>

                    <h3>Your cart is empty</h3>

                    <p>Add some delicious food from the menu.</p>

                    <a href="menu.html" class="btn btn-primary">
                        Browse Menu
                    </a>

                </div>
            `;

            return;
        }


        cartContainer.innerHTML = cart.map(function (item) {

            const price = Number(item.price) || 0;
            const quantity = Number(item.quantity) || 1;
            const itemTotal = price * quantity;

            return `
                <div class="cart-item-card">

                    <div class="cart-item-info">

                        <div class="cart-item-title">
                            ${escapeHTML(item.name)}
                        </div>

                        <div class="cart-item-price">
                            ${price.toFixed(2)} ETB
                        </div>

                    </div>


                    <div class="cart-item-controls">

                        <div class="qty-control">

                            <button
                                type="button"
                                class="btn-qty decrease-btn"
                                data-id="${escapeHTML(String(item.id))}"
                            >
                                −
                            </button>

                            <span class="qty-value">
                                ${quantity}
                            </span>

                            <button
                                type="button"
                                class="btn-qty increase-btn"
                                data-id="${escapeHTML(String(item.id))}"
                            >
                                +
                            </button>

                        </div>


                        <strong class="item-total-price">
                            ${itemTotal.toFixed(2)} ETB
                        </strong>


                        <button
                            type="button"
                            class="btn-remove remove-btn"
                            data-id="${escapeHTML(String(item.id))}"
                            title="Remove item"
                        >
                            <i class="fa-solid fa-trash"></i>
                        </button>

                    </div>

                </div>
            `;

        }).join("");
    }


    function escapeHTML(value) {

        const div = document.createElement("div");

        div.textContent = value || "";

        return div.innerHTML;
    }


    document.addEventListener("click", function (event) {

        const increaseButton =
            event.target.closest(".increase-btn");

        const decreaseButton =
            event.target.closest(".decrease-btn");

        const removeButton =
            event.target.closest(".remove-btn");


        if (increaseButton) {

            const id = String(
                increaseButton.dataset.id
            );

            const cart = getCart();

            const item = cart.find(function (item) {
                return String(item.id) === id;
            });

            if (item) {

                item.quantity =
                    (Number(item.quantity) || 0) + 1;

                saveCart(cart);
                updateCart();
            }

            return;
        }


        if (decreaseButton) {

            const id = String(
                decreaseButton.dataset.id
            );

            const cart = getCart();

            const item = cart.find(function (item) {
                return String(item.id) === id;
            });

            if (item) {

                item.quantity =
                    (Number(item.quantity) || 0) - 1;


                if (item.quantity <= 0) {

                    const newCart =
                        cart.filter(function (cartItem) {
                            return String(cartItem.id) !== id;
                        });

                    saveCart(newCart);

                } else {

                    saveCart(cart);
                }

                updateCart();
            }

            return;
        }


        if (removeButton) {

            const id = String(
                removeButton.dataset.id
            );

            const newCart =
                getCart().filter(function (item) {
                    return String(item.id) !== id;
                });

            saveCart(newCart);
            updateCart();

            return;
        }

    });


    if (clearCartBtn) {

        clearCartBtn.addEventListener(
            "click",
            function () {

                const cart = getCart();

                if (cart.length === 0) {
                    return;
                }

                const confirmClear = confirm(
                    "Are you sure you want to clear your cart?"
                );

                if (!confirmClear) {
                    return;
                }

                localStorage.removeItem(CART_KEY);

                localStorage.removeItem(CHECKOUT_KEY);

                window.dispatchEvent(
                    new CustomEvent("cart:updated")
                );

                updateCart();
            }
        );
    }


    if (checkoutBtn) {

        checkoutBtn.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                const cart = getCart();


                if (!Array.isArray(cart) || cart.length === 0) {

                    alert("Your cart is empty.");

                    return;
                }


                localStorage.setItem(
                    CHECKOUT_KEY,
                    JSON.stringify(cart)
                );


                const checkoutUrl =
                    new URL(
                        "checkout.html",
                        window.location.href
                    ).href;


                console.log("Going to checkout:", checkoutUrl);


                window.location.assign(checkoutUrl);

            }
        );
    }


    window.addEventListener(
        "cart:updated",
        updateCart
    );


    window.addEventListener(
        "storage",
        updateCart
    );


    updateCart();

});