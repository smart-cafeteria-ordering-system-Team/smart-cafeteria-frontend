/**
 * Menu JavaScript
 * Handles category filtering, search, sorting, and add-to-cart actions.
 */

document.addEventListener("DOMContentLoaded", function () {
    const CART_KEY = "smart_cafeteria_cart";
    const API_BASE_URL = "https://smart-cafeteria-frontend.onrender.com";
    const categoryButtons = document.querySelectorAll(".category-pill");
    let foodCards = [];
    const noResults = document.getElementById("no-results");
    const resetSearchButton = document.getElementById("reset-search-btn");
    const searchInput = document.getElementById("menu-search-input");
    const mobileSearchInput = document.getElementById("mobile-search-input");
    const priceSort = document.getElementById("price-sort");
    const resultsCount = document.getElementById("results-count");

    let currentCategory = "all";
    let currentSearch = "";
    let currentSort = "recommended";

    function getImageUrl(imagePath) {
        if (!imagePath) return "";
        const value = String(imagePath);
        if (
            value.startsWith("http://") ||
            value.startsWith("https://") ||
            value.startsWith("data:")
        ) {
            return value;
        }
        const cleanPath = value.startsWith("/") ? value : `/${value}`;
        return API_BASE_URL + cleanPath;
    }

    function getCart() {
        try {
            const savedCart = localStorage.getItem(CART_KEY);
            if (!savedCart) return [];
            const cart = JSON.parse(savedCart);
            return Array.isArray(cart) ? cart : [];
        } catch (error) {
            console.error("Error reading cart:", error);
            return [];
        }
    }

    function saveCart(cart) {
        const safeCart = Array.isArray(cart) ? cart : [];
        localStorage.setItem(CART_KEY, JSON.stringify(safeCart));
        window.dispatchEvent(new CustomEvent("cart:updated", { detail: safeCart }));
    }

    function getCardCategories(card) {
        const category = card.getAttribute("data-category");
        if (!category) return [];
        return category.toLowerCase().trim().split(/\s+/);
    }

    function getFoodName(card) {
        const title = card.querySelector(".food-title");
        return title ? title.textContent.toLowerCase() : "";
    }

    function getFoodDescription(card) {
        const description = card.querySelector(".food-description");
        return description ? description.textContent.toLowerCase() : "";
    }

    function getFoodPrice(card) {
        const priceElement = card.querySelector(".food-price");
        if (!priceElement) return 0;

        const priceValue = priceElement.textContent.replace(/[^\d.]/g, "");
        const price = parseFloat(priceValue);
        return Number.isFinite(price) ? price : 0;
    }

    function getFoodId(card, button) {
        if (button.dataset.id) return String(button.dataset.id);
        if (card.dataset.id) return String(card.dataset.id);
        if (button.dataset.menuItemId) return String(button.dataset.menuItemId);
        if (card.dataset.menuItemId) return String(card.dataset.menuItemId);

        const title = card.querySelector(".food-title");
        if (title) {
            return title.textContent.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        }

        return "";
    }

    function updateCartBadges() {
        const cart = getCart();
        const totalQuantity = cart.reduce(function (sum, item) {
            return sum + (Number(item.quantity) || 0);
        }, 0);

        document.querySelectorAll("#cart-count, #cart-badge-count, #mobile-cart-badge, #navbar-cart-count").forEach(function (badge) {
            badge.textContent = totalQuantity;
        });
    }

    function addToCart(button) {
        const card = button.closest(".food-card");
        if (!card) {
            console.error("Food card not found.");
            return;
        }

        const id = getFoodId(card, button);
        const name = card.querySelector(".food-title") ? card.querySelector(".food-title").textContent.trim() : "Unknown Food";
        const price = button.dataset.price ? Number(button.dataset.price) : getFoodPrice(card);
        const image = getImageUrl(button.dataset.image || (card.querySelector("img") ? card.querySelector("img").src : ""));

        if (!id) {
            console.error("Food ID not found.", card);
            return;
        }

        if (!Number.isFinite(price)) {
            console.error("Invalid food price:", price);
            return;
        }

        const cart = getCart();
        const existingItem = cart.find(function (entry) {
            return String(entry._id || entry.menuItemId || entry.id) === String(id);
        });

        if (existingItem) {
            existingItem.quantity = (Number(existingItem.quantity) || 0) + 1;
        } else {
            cart.push({
                id: id,
                _id: id,
                menuItemId: id,
                name: name,
                price: price,
                image: image,
                quantity: 1
            });
        }

        saveCart(cart);
        updateCartBadges();

        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="fa-solid fa-check"></i> Added';
        button.disabled = true;

        setTimeout(function () {
            button.innerHTML = originalHTML;
            button.disabled = false;
        }, 700);
    }

    function filterMenu() {
        let visibleCards = [];

        foodCards = Array.from(document.querySelectorAll(".food-card"));

        foodCards.forEach(function (card) {
            const categories = getCardCategories(card);
            const foodName = getFoodName(card);
            const foodDescription = getFoodDescription(card);

            const categoryMatch = currentCategory === "all" || categories.includes(currentCategory);
            const searchTerm = currentSearch.trim().toLowerCase();
            const searchMatch = !searchTerm || foodName.includes(searchTerm) || foodDescription.includes(searchTerm);

            const shouldShow = categoryMatch && searchMatch;
            card.style.display = shouldShow ? "" : "none";

            if (shouldShow) visibleCards.push(card);
        });

        if (priceSort && currentSort !== "recommended") {
            const cards = Array.from(foodCards).sort(function (a, b) {
                const priceA = getFoodPrice(a);
                const priceB = getFoodPrice(b);
                return currentSort === "low-to-high" ? priceA - priceB : priceB - priceA;
            });

            const container = document.getElementById("food-grid-container");
            if (container) {
                cards.forEach(function (card) {
                    container.appendChild(card);
                });
            }
        }

        if (resultsCount) {
            resultsCount.textContent = `${visibleCards.length} items`;
        }

        if (noResults) {
            noResults.style.display = visibleCards.length === 0 ? "block" : "none";
        }
    }

    if (categoryButtons.length) {
        categoryButtons.forEach(function (button) {
            button.addEventListener("click", function () {
                currentCategory = button.dataset.category || "all";
                categoryButtons.forEach(function (item) {
                    item.classList.toggle("active", item === button);
                });
                filterMenu();
            });
        });
    }

    if (searchInput) {
        searchInput.addEventListener("input", function (event) {
            currentSearch = event.target.value.trim();
            if (mobileSearchInput) mobileSearchInput.value = event.target.value;
            filterMenu();
        });
    }

    if (mobileSearchInput) {
        mobileSearchInput.addEventListener("input", function (event) {
            currentSearch = event.target.value.trim();
            if (searchInput) searchInput.value = event.target.value;
            filterMenu();
        });
    }

    if (priceSort) {
        priceSort.addEventListener("change", function (event) {
            currentSort = event.target.value || "recommended";
            filterMenu();
        });
    }

    if (resetSearchButton) {
        resetSearchButton.addEventListener("click", function () {
            currentCategory = "all";
            currentSearch = "";
            currentSort = "recommended";

            if (searchInput) searchInput.value = "";
            if (mobileSearchInput) mobileSearchInput.value = "";
            if (priceSort) priceSort.value = "recommended";

            categoryButtons.forEach(function (button) {
                button.classList.toggle("active", button.dataset.category === "all");
            });

            filterMenu();
        });
    }

    document.addEventListener("click", function (event) {
        const button = event.target.closest(".add-to-cart-btn, .add-to-cart, [data-add-to-cart]");
        if (!button) return;
        event.preventDefault();
        addToCart(button);
    });

    window.addEventListener("cart:updated", updateCartBadges);
    window.addEventListener("storage", updateCartBadges);

    updateCartBadges();
    filterMenu();
});
