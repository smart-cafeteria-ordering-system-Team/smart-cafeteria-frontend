document.addEventListener("DOMContentLoaded", function () {

    // =========================================================
    // ELEMENTS
    // =========================================================

    const categoryButtons =
        document.querySelectorAll(".category-pill");

    const foodCards =
        document.querySelectorAll(".food-card");

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
    // CURRENT FILTER STATE
    // =========================================================

    let currentCategory = "all";
    let currentSearch = "";
    let currentSort = "recommended";


    // =========================================================
    // CHECK ELEMENTS
    // =========================================================

    if (!categoryButtons.length) {
        console.error("ERROR: Category buttons not found.");
    }

    if (!foodCards.length) {
        console.error("ERROR: Food cards not found.");
    }


    // =========================================================
    // GET CARD CATEGORY
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


    // =========================================================
    // GET FOOD NAME
    // =========================================================

    function getFoodName(card) {

        const title =
            card.querySelector(".food-title");

        return title
            ? title.textContent.toLowerCase()
            : "";
    }


    // =========================================================
    // GET FOOD DESCRIPTION
    // =========================================================

    function getFoodDescription(card) {

        const description =
            card.querySelector(".food-description");

        return description
            ? description.textContent.toLowerCase()
            : "";
    }


    // =========================================================
    // GET FOOD PRICE
    // =========================================================

    function getFoodPrice(card) {

        const priceElement =
            card.querySelector(".food-price");

        if (!priceElement) {
            return 0;
        }

        const price =
            parseFloat(
                priceElement.textContent.replace(/[^\d.]/g, "")
            );

        return isNaN(price) ? 0 : price;
    }


    // =========================================================
    // FILTER MENU
    // =========================================================

    function filterMenu() {

        let visibleCards = [];


        // -----------------------------------------------------
        // FILTER FOOD CARDS
        // -----------------------------------------------------

        foodCards.forEach(function (card) {

            const categories =
                getCardCategories(card);

            const foodName =
                getFoodName(card);

            const foodDescription =
                getFoodDescription(card);


            // Category match
            const categoryMatch =
                currentCategory === "all" ||
                categories.includes(currentCategory);


            // Search match
            const searchMatch =
                currentSearch === "" ||
                foodName.includes(currentSearch) ||
                foodDescription.includes(currentSearch) ||
                categories.some(function (category) {
                    return category.includes(currentSearch);
                });


            // Show / hide
            if (categoryMatch && searchMatch) {

                card.style.display = "";

                visibleCards.push(card);

            } else {

                card.style.display = "none";

            }

        });


        // -----------------------------------------------------
        // SORT RESULTS
        // -----------------------------------------------------

        if (currentSort === "low-to-high") {

            sortCardsByPrice(visibleCards, false);

        } else if (currentSort === "high-to-low") {

            sortCardsByPrice(visibleCards, true);

        }


        // -----------------------------------------------------
        // UPDATE RESULT COUNT
        // -----------------------------------------------------

        updateResultsCount(visibleCards.length);


        // -----------------------------------------------------
        // EMPTY STATE
        // -----------------------------------------------------

        if (noResults) {

            if (visibleCards.length === 0) {

                noResults.classList.remove("hidden");

            } else {

                noResults.classList.add("hidden");

            }

        }

    }


    // =========================================================
    // SORT CARDS BY PRICE
    // =========================================================

    function sortCardsByPrice(cards, descending) {

        const container =
            document.getElementById("food-grid-container");

        if (!container) {
            return;
        }


        cards.sort(function (a, b) {

            const priceA = getFoodPrice(a);
            const priceB = getFoodPrice(b);

            if (descending) {
                return priceB - priceA;
            }

            return priceA - priceB;

        });


        cards.forEach(function (card) {
            container.appendChild(card);
        });

    }


    // =========================================================
    // UPDATE RESULTS COUNT
    // =========================================================

    function updateResultsCount(count) {

        if (!resultsCount) {
            return;
        }


        if (currentCategory === "all" && currentSearch === "") {

            resultsCount.textContent =
                `Showing all ${count} menu options`;

            return;
        }


        let categoryName = "";


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

            default:
                categoryName = "menu";
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

        button.addEventListener("click", function () {

            // Get category
            currentCategory =
                this.getAttribute("data-category");


            // Remove active class
            categoryButtons.forEach(function (btn) {

                btn.classList.remove("active");

            });


            // Add active class
            this.classList.add("active");


            // Apply filter
            filterMenu();

        });

    });


    // =========================================================
    // DESKTOP SEARCH
    // =========================================================

    if (searchInput) {

        searchInput.addEventListener("input", function () {

            currentSearch =
                this.value.toLowerCase().trim();


            // Keep mobile search synchronized
            if (mobileSearchInput) {
                mobileSearchInput.value = this.value;
            }


            filterMenu();

        });

    }


    // =========================================================
    // MOBILE SEARCH
    // =========================================================

    if (mobileSearchInput) {

        mobileSearchInput.addEventListener("input", function () {

            currentSearch =
                this.value.toLowerCase().trim();


            // Keep desktop search synchronized
            if (searchInput) {
                searchInput.value = this.value;
            }


            filterMenu();

        });

    }


    // =========================================================
    // PRICE SORT
    // =========================================================

    if (priceSort) {

        priceSort.addEventListener("change", function () {

            currentSort = this.value;

            filterMenu();

        });

    }


    // =========================================================
    // RESET FILTERS
    // =========================================================

    if (resetSearchButton) {

        resetSearchButton.addEventListener("click", function () {

            // Reset category
            currentCategory = "all";


            // Reset search
            currentSearch = "";


            // Reset sort
            currentSort = "recommended";


            // Reset search inputs
            if (searchInput) {
                searchInput.value = "";
            }

            if (mobileSearchInput) {
                mobileSearchInput.value = "";
            }


            // Reset sort select
            if (priceSort) {
                priceSort.value = "recommended";
            }


            // Reset active category
            categoryButtons.forEach(function (button) {

                button.classList.remove("active");

            });


            const allButton =
                document.querySelector(
                    '.category-pill[data-category="all"]'
                );

            if (allButton) {
                allButton.classList.add("active");
            }


            // Apply reset
            filterMenu();

        });

    }


    // =========================================================
    // ADD TO CART
    // =========================================================

    document.addEventListener("click", function (event) {

        const addToCartButton =
            event.target.closest(".add-to-cart-btn, .add-to-cart, [data-add-to-cart]");

        if (!addToCartButton) {
            return;
        }

        const card =
            addToCartButton.closest(".food-card");

        if (!card) {
            return;
        }

        const name =
            card.querySelector(".food-title")
                ? card.querySelector(".food-title").textContent.trim()
                : "Unknown Item";

        const price =
            getFoodPrice(card);

        console.log(`Added to cart: ${name} - $${price}`);

        // Insert your custom cart state logic or API call here

    });


    // =========================================================
    // INITIAL LOAD
    // =========================================================

    filterMenu();

});