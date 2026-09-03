/**
 * Smart Cafeteria Ordering System
 * File: Frontend/src/js/customer-menu.js
 *
 * Loads menu items from the live backend (GET /api/v1/menu) and
 * renders them into the student menu page. Keeps the existing
 * .food-card DOM contract so menu.js (category/search/sort and
 * add-to-cart delegation) keeps working across admin availability
 * toggles.
 */

const CUSTOMER_MENU_API_BASE = "http://localhost:5000";

const CUSTOMER_MENU = {

    API_BASE: CUSTOMER_MENU_API_BASE + "/api/v1",
    CART_KEY: "smart_cafeteria_cart",

    // Database category values mapped onto the static filter pills
    CATEGORY_ALIASES: {
        "mains": "mains",
        "main-meals": "mains",
        "lunch": "mains",
        "dinner": "mains",
        "breakfast": "breakfast",
        "fasting": "fasting",
        "beverages": "beverages",
        "drinks": "beverages",
        "snacks": "snacks"
    },

    PLACEHOLDER_IMAGE:
        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200'><rect width='100%' height='100%' fill='%23f1f5f9'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%2364748b' font-size='16'>Food Item</text></svg>",

    DEFAULT_IMAGE:
        CUSTOMER_MENU_API_BASE + "/uploads/default-food.png",

};


document.addEventListener("DOMContentLoaded", function () {

    const grid =
        document.getElementById("food-grid-container");

    const resultsCount =
        document.getElementById("results-count");

    const noResults =
        document.getElementById("no-results");


    // =========================================================
    // HELPERS
    // =========================================================

    function escapeHTML(value) {

        if (value === null || value === undefined) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    // Resolve any stored image reference into an absolute, loadable URL.
    // Absolute URLs (http/https/data) are returned as-is; everything else is
    // served by the backend so it is prefixed with the API origin.
    function getImageUrl(imagePath) {

        if (!imagePath) {
            return "";
        }

        const value = String(imagePath);

        if (
            value.startsWith("http://") ||
            value.startsWith("https://") ||
            value.startsWith("data:")
        ) {
            return value;
        }

        const cleanPath =
            value.startsWith("/")
                ? value
                : `/${value}`;

        return CUSTOMER_MENU.API_BASE.replace("/api/v1", "") + cleanPath;
    }


    function mapCategory(category) {

        const key = String(category || "")
            .toLowerCase()
            .trim();

        return CUSTOMER_MENU.CATEGORY_ALIASES[key] || key;
    }


    function isUnavailable(item) {

        return item.availability === false ||
            item.isAvailable === false;
    }


    // =========================================================
    // RENDER
    // =========================================================

    function renderMenu(items) {

        if (!grid) {
            return;
        }

        if (!items.length) {

            grid.innerHTML = "";

            if (noResults) {
                noResults.classList.remove("hidden");
            }

            triggerAllFilter();

            return;
        }


        const cardsHTML = items.map(function (item) {

            const id =
                escapeHTML(item._id || item.id);
            const menuItemId =
                escapeHTML(item._id || item.id);

            const nameEn =
                escapeHTML(item.name?.en || "");

            const nameAm =
                escapeHTML(item.name?.am || "");

            const description =
                escapeHTML(item.description?.en || "");

            const price =
                Number(item.price) || 0;

            const category =
                mapCategory(item.category);

            const image =
                escapeHTML(getImageUrl(item.image || item.imageUrl));

            const displayTitle =
                nameAm && nameAm !== nameEn
                    ? `${nameEn} /${nameAm}`
                    : nameEn;

            const unavailable =
                isUnavailable(item);

            const cardClass =
                unavailable
                    ? "food-card is-unavailable"
                    : "food-card";

            const statusHTML =
                unavailable
                    ? `
                    <span class="status-stock out-of-stock">
                        <i class="fa-solid fa-circle-xmark"></i>
                        Not Available
                    </span>`
                    : `
                    <span class="status-stock in-stock">
                        <i class="fa-solid fa-circle-check"></i>
                        Available
                    </span>`;

            const addButtonHTML =
                unavailable
                    ? `
                        <button
                            type="button"
                            class="btn btn-primary add-to-cart-btn"
                            disabled
                            aria-disabled="true"
                            aria-label="Currently unavailable"
                            title="Currently unavailable">

                            <i class="fa-solid fa-circle-minus"></i>
                            Unavailable

                        </button>`
                    : `
                        <button
                            type="button"
                            class="btn btn-primary add-to-cart-btn"
                            data-id="${id}"
                            data-menu-item-id="${menuItemId}"
                            data-name="${nameEn}"
                            data-price="${price}"
                            data-image="${image}">

                            <i class="fa-solid fa-plus"></i>
                            Add

                        </button>`;

            return `
            <article class="${cardClass}"
                     data-category="${category}"
                     data-id="${id}">

                <div class="food-card-image">

                    <img
                        src="${image || CUSTOMER_MENU.PLACEHOLDER_IMAGE}"
                        alt="${nameEn}"
                        loading="lazy"
                        onerror="this.onerror=null;this.src='${CUSTOMER_MENU.DEFAULT_IMAGE}';"
                    >

                </div>

                <div class="food-card-body">

                    <div class="food-header">

                        <h3 class="food-title">
                            ${displayTitle}
                        </h3>

                        <span class="food-price">
                            ${price} <small>ብር</small>
                        </span>

                    </div>

                    <p class="food-description">
                        ${description || "Delicious item from our kitchen."}
                    </p>

                    <div class="food-card-footer">

                        ${statusHTML}

                        <div class="card-actions">

                            <a href="food-details.html?id=${id}"
                               class="btn btn-icon-secondary"
                               title="View Details">

                                <i class="fa-solid fa-eye"></i>

                            </a>

                            ${addButtonHTML}

                        </div>

                    </div>

                </div>

            </article>`;

        }).join("");


        grid.innerHTML = cardsHTML;

        if (noResults) {
            noResults.classList.add("hidden");
        }

        triggerAllFilter();
    }


    function triggerAllFilter() {

        const allButton =
            document.querySelector(
                '.category-pill[data-category="all"]'
            );

        // Re-runs menu.js filterMenu() against the now-rendered
        // cards so results count + empty state stay in sync.
        if (allButton) {
            allButton.click();
        }
    }


    // =========================================================
    // LOADING / ERROR STATES
    // =========================================================

    function renderError() {

        if (!grid) {
            return;
        }

        grid.innerHTML = `

            <div class="menu-state menu-error" id="menu-error">

                <i class="fa-solid fa-circle-exclamation"></i>

                <h3>
                    Unable to Load Menu
                </h3>

                <p>
                    We couldn't reach the menu right now.
                    Please check your connection and try again.
                </p>

                <button
                    type="button"
                    class="btn btn-primary"
                    id="menu-retry-btn">

                    <i class="fa-solid fa-rotate-right"></i>
                    Try Again

                </button>

            </div>`;

        if (resultsCount) {
            resultsCount.textContent =
                "Menu unavailable";
        }

        if (noResults) {
            noResults.classList.add("hidden");
        }
    }


    function showLoading() {

        if (resultsCount) {
            resultsCount.textContent =
                "Loading menu...";
        }
    }


    // =========================================================
    // DATA LOADING
    // =========================================================

    async function fetchMenu() {

        const limit = 50;
        let page = 1;

        const items = [];
        const seen = new Set();


        while (true) {

            const controller =
                new AbortController();

            const timeout =
                setTimeout(function () {
                    controller.abort();
                }, 10000);

            let response;

            try {

                response =
                    await fetch(
                        `${CUSTOMER_MENU.API_BASE}/menu?limit=${limit}&page=${page}`,
                        { signal: controller.signal }
                    );

            } finally {

                clearTimeout(timeout);
            }


            if (!response.ok) {
                throw new Error(
                    "Menu request failed: " + response.status
                );
            }


            const json =
                await response.json();

            const batch =
                Array.isArray(json.items)
                    ? json.items
                    : [];


            batch.forEach(function (item) {

                const itemId = item._id || item.id;

                if (itemId && !seen.has(itemId)) {

                    seen.add(itemId);
                    items.push(item);
                }
            });


            const total =
                Number(json.total) ||
                items.length;

            const totalPages =
                Math.ceil(total / limit);


            if (
                page >= totalPages ||
                items.length >= total ||
                batch.length === 0
            ) {
                break;
            }


            page++;
        }


        return items;
    }


    async function loadMenu() {

        showLoading();

        try {

            const items =
                await fetchMenu();

            renderMenu(items);

        } catch (error) {

            console.error("Failed to load menu:", error);

            renderError();
        }
    }


    // =========================================================
    // EVENTS
    // =========================================================

    document.addEventListener(
        "click",
        function (event) {

            const retryButton =
                event.target.closest("#menu-retry-btn");

            if (retryButton) {
                loadMenu();
            }
        }
    );


    // =========================================================
    // INITIAL LOAD
    // =========================================================

    loadMenu();

});