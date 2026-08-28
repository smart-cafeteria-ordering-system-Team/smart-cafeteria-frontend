/**
 * Menu JavaScript
 * File: Frontend/src/js/menu.js
 *
 * Handles:
 * - Category filtering
 * - Search
 * - Price sorting
 * - Add to cart
 * - Cart badge
 */

document.addEventListener("DOMContentLoaded", function () {

    // =========================================================
    // CART CONFIGURATION
    // =========================================================

    const CART_KEY = "smart_cafeteria_cart";


    // =========================================================
    // ELEMENTS
    // =========================================================

    const categoryButtons =
        document.querySelectorAll(".category-pill");

    const resultsCount =
        document.getElementById("results-count");

    const noResults =
        document.getElementById("no-results");

    const resetSearchButton =
        document.getElementById("reset-search-btn");

    const searchInput =
        document.getElementById("menu-search-input");

    const mobileSearchInput =
        document.getElementById("mobile-search-input");

    const priceSort =
        document.getElementById("price-sort");


    // =========================================================
    // FILTER STATE
    // =========================================================

    let currentCategory = "all";
    let currentSearch = "";
    let currentSort = "recommended";


    // =========================================================
    // CART FUNCTIONS
    // =========================================================

    function getCart() {

        try {

            const savedCart =
                localStorage.getItem(CART_KEY);

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
            new CustomEvent("cart:updated", {
                detail: cart
            })
        );
    }


    function updateCartBadges() {

        const cart = getCart();

        const totalQuantity =
            cart.reduce(function (total, item) {

                return total +
                    Number(item.quantity || 0);

            }, 0);


        // Different possible cart badges
        const badges = document.querySelectorAll(
            "#cart-count, #cart-badge-count, #mobile-cart-badge"
        );


        badges.forEach(function (badge) {

            badge.textContent = totalQuantity;

        });
    }


    // =========================================================
    // GET FOOD DATA FROM CARD
    // =========================================================

    function getFoodPrice(card) {

        const priceElement =
            card.querySelector(".food-price");

        if (!priceElement) {
            return 0;
        }

        const price =
            parseFloat(
                priceElement.textContent
                    .replace(/[^\d.]/g, "")
            );

        return Number.isFinite(price)
            ? price
            : 0;
    }


    function getFoodId(card, button) {

        // First try button data-id
        if (button.dataset.id) {
            return String(button.dataset.id);
        }

        // Then card data-id
        if (card.dataset.id) {
            return String(card.dataset.id);
        }

        // Then menuItemId
        if (button.dataset.menuItemId) {
            return String(button.dataset.menuItemId);
        }

        if (card.dataset.menuItemId) {
            return String(card.dataset.menuItemId);
        }

        // Generate stable ID from name
        const title =
            card.querySelector(".food-title");

        if (title) {

            return title.textContent
                .trim()
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9-]/g, "");

        }

        return "";
    }


    function getFoodName(card, button) {

        if (button.dataset.name) {
            return button.dataset.name.trim();
        }

        const title =
            card.querySelector(".food-title");

        return title
            ? title.textContent.trim()
            : "Unknown Food";
    }


    function getFoodImage(card, button) {

        if (button.dataset.image) {
            return button.dataset.image;
        }

        const image =
            card.querySelector("img");

        return image
            ? image.src
            : "";
    }


    // =========================================================
    // ADD TO CART
    // =========================================================

    function addToCart(button) {

        const card =
            button.closest(".food-card");

        if (!card) {

            console.error(
                "Food card not found."
            );

            return;
        }


        const id =
            getFoodId(card, button);

        const name =
            getFoodName(card, button);

        const price =
            button.dataset.price
                ? Number(button.dataset.price)
                : getFoodPrice(card);

        const image =
            getFoodImage(card, button);


        if (!id) {

            console.error(
                "Food ID not found.",
                card
            );

            return;
        }


        if (!Number.isFinite(price)) {

            console.error(
                "Invalid food price:",
                price
            );

            return;
        }


        let cart = getCart();


        // Find existing item
        const existingItem =
            cart.find(function (item) {

                return String(
                    item.menuItemId
                ) === String(id);

            });


        if (existingItem) {

            existingItem.quantity =
                Number(existingItem.quantity || 0) + 1;

        } else {

            cart.push({

                menuItemId: id,

                name: name,

                price: price,

                image: image,

                quantity: 1

            });
        }


        // Save
        saveCart(cart);


        // Update badge
        updateCartBadges();


        // Visual feedback
        const originalHTML =
            button.innerHTML;


        button.innerHTML =
            '<i class="fa-solid fa-check"></i> Added';

        button.disabled = true;


        setTimeout(function () {

            button.innerHTML =
                originalHTML;

            button.disabled = false;

        }, 700);


        console.log(
            "Added to cart:",
            {
                menuItemId: id,
                name: name,
                price: price,
                quantity: 1
            }
        );
    }


    // =========================================================
    // ADD TO CART CLICK
    // =========================================================

    document.addEventListener(
        "click",
        function (event) {

            const button =
                event.target.closest(
                    ".add-to-cart-btn, .add-to-cart, [data-add-to-cart]"
                );


            if (!button) {
                return;
            }


            event.preventDefault();


            addToCart(button);

        }
    );


    // =========================================================
    // CATEGORY FUNCTIONS
    // =========================================================

    function getCardCategories(card) {

        const category =
            card.getAttribute("data-category");

        if (!category) {
            return [];
        }

        return category
            .toLowerCase()
            .trim()
            .split(/\s+/);
    }


    function getFoodNameForSearch(card) {

        const title =
            card.querySelector(".food-title");

        return title
            ? title.textContent.toLowerCase()
            : "";
    }


    function getFoodDescription(card) {

        const description =
            card.querySelector(".food-description");

        return description
            ? description.textContent.toLowerCase()
            : "";
    }


    // =========================================================
    // FILTER MENU
    // =========================================================

    function filterMenu() {

        const foodCards =
            document.querySelectorAll(".food-card");

        let visibleCards = [];


        foodCards.forEach(function (card) {

            const categories =
                getCardCategories(card);

            const foodName =
                getFoodNameForSearch(card);

            const foodDescription =
                getFoodDescription(card);


            const categoryMatch =
                currentCategory === "all" ||
                categories.includes(
                    currentCategory
                );


            const searchMatch =
                currentSearch === "" ||
                foodName.includes(currentSearch) ||
                foodDescription.includes(currentSearch) ||
                categories.some(function (category) {

                    return category.includes(
                        currentSearch
                    );

                });


            if (
                categoryMatch &&
                searchMatch
            ) {

                card.style.display = "";

                visibleCards.push(card);

            } else {

                card.style.display = "none";

            }

        });


        // Sort
        if (currentSort === "low-to-high") {

            sortCardsByPrice(
                visibleCards,
                false
            );

        } else if (
            currentSort === "high-to-low"
        ) {

            sortCardsByPrice(
                visibleCards,
                true
            );
        }


        updateResultsCount(
            visibleCards.length
        );


        if (noResults) {

            if (visibleCards.length === 0) {

                noResults.classList.remove(
                    "hidden"
                );

            } else {

                noResults.classList.add(
                    "hidden"
                );
            }
        }
    }


    // =========================================================
    // SORT
    // =========================================================

    function sortCardsByPrice(
        cards,
        descending
    ) {

        const container =
            document.getElementById(
                "food-grid-container"
            );

        if (!container) {
            return;
        }


        cards.sort(function (a, b) {

            const priceA =
                getFoodPrice(a);

            const priceB =
                getFoodPrice(b);


            return descending
                ? priceB - priceA
                : priceA - priceB;

        });


        cards.forEach(function (card) {

            container.appendChild(card);

        });
    }


    // =========================================================
    // RESULT COUNT
    // =========================================================

    function updateResultsCount(count) {

        if (!resultsCount) {
            return;
        }


        if (
            currentCategory === "all" &&
            currentSearch === ""
        ) {

            resultsCount.textContent =
                `Showing all ${count} menu options`;

            return;
        }


        let categoryName = "menu";


        switch (currentCategory) {

            case "breakfast":
                categoryName = "Breakfast";
                break;

            case "mains":
                categoryName = "Lunch & Dinner";
                break;

            case "coffee":
                categoryName = "Coffee & Tea";
                break;

            case "pastry":
                categoryName = "Cakes & Pastry";
                break;

            case "drinks":
                categoryName = "Juices & Drinks";
                break;
        }


        if (currentSearch !== "") {

            resultsCount.textContent =
                `Showing ${count} search result${count !== 1 ? "s" : ""}`;

        } else {

            resultsCount.textContent =
                `Showing ${count} ${categoryName} item${count !== 1 ? "s" : ""}`;

        }
    }


    // =========================================================
    // CATEGORY BUTTONS
    // =========================================================

    categoryButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                currentCategory =
                    this.getAttribute(
                        "data-category"
                    );


                categoryButtons.forEach(
                    function (btn) {

                        btn.classList.remove(
                            "active"
                        );

                    }
                );


                this.classList.add("active");


                filterMenu();
            }
        );
    });


    // =========================================================
    // SEARCH
    // =========================================================

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            function () {

                currentSearch =
                    this.value
                        .toLowerCase()
                        .trim();


                if (mobileSearchInput) {

                    mobileSearchInput.value =
                        this.value;
                }


                filterMenu();

            }
        );
    }


    if (mobileSearchInput) {

        mobileSearchInput.addEventListener(
            "input",
            function () {

                currentSearch =
                    this.value
                        .toLowerCase()
                        .trim();


                if (searchInput) {

                    searchInput.value =
                        this.value;
                }


                filterMenu();

            }
        );
    }


    // =========================================================
    // PRICE SORT
    // =========================================================

    if (priceSort) {

        priceSort.addEventListener(
            "change",
            function () {

                currentSort =
                    this.value;

                filterMenu();

            }
        );
    }


    // =========================================================
    // RESET
    // =========================================================

    if (resetSearchButton) {

        resetSearchButton.addEventListener(
            "click",
            function () {

                currentCategory = "all";
                currentSearch = "";
                currentSort = "recommended";


                if (searchInput) {
                    searchInput.value = "";
                }

                if (mobileSearchInput) {
                    mobileSearchInput.value = "";
                }

                if (priceSort) {
                    priceSort.value = "recommended";
                }


                categoryButtons.forEach(
                    function (button) {

                        button.classList.remove(
                            "active"
                        );

                    }
                );


                const allButton =
                    document.querySelector(
                        '.category-pill[data-category="all"]'
                    );


                if (allButton) {

                    allButton.classList.add(
                        "active"
                    );
                }


                filterMenu();
            }
        );
    }


    // =========================================================
    // CART EVENTS
    // =========================================================

    window.addEventListener(
        "cart:updated",
        updateCartBadges
    );

    window.addEventListener(
        "storage",
        updateCartBadges
    );


    // =========================================================
    // INITIAL LOAD
    // =========================================================

    updateCartBadges();

    filterMenu();

});