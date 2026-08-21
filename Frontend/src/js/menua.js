document.addEventListener("DOMContentLoaded", () => {
    initMenuPage();
});

let menuItems = [];
let categoriesList = [];

async function initMenuPage() {
    initSidebarToggle();
    initLogout();
    await loadCategories();
    await loadMenuItems();
    setupModalEvents();
    setupFilterEvents();
}

function initSidebarToggle() {
    const toggleBtn = document.getElementById("sidebarToggle");
    const sidebar = document.getElementById("adminSidebar");
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener("click", () => sidebar.classList.toggle("open"));
    }
}

function initLogout() {
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            if (confirm("Log out of Admin Panel?")) {
                localStorage.removeItem("user");
                localStorage.removeItem("token");
                window.location.href = "../auth/login.html";
            }
        });
    }
}

/**
 * Load system categories from API with LocalStorage fallback
 */
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        if (!response.ok) throw new Error("API offline");
        categoriesList = await response.json();
        localStorage.setItem("systemCategories", JSON.stringify(categoriesList));
    } catch (error) {
        console.warn("Categories API offline. Using LocalStorage fallback.");
        const storedCategories = localStorage.getItem("systemCategories");
        categoriesList = storedCategories
            ? JSON.parse(storedCategories)
            : ["Breakfast", "Lunch", "Dinner", "Drinks", "Snacks"];
        localStorage.setItem("systemCategories", JSON.stringify(categoriesList));
    }

    const categoryFilterSelect = document.getElementById("categoryFilterSelect");
    const foodCategorySelect = document.getElementById("foodCategory");
    const categoryOptions = categoriesList.map(cat => `<option value="${cat}">${cat}</option>`).join("");

    if (categoryFilterSelect) {
        categoryFilterSelect.innerHTML = `<option value="all">All Categories</option>` + categoryOptions;
    }
    if (foodCategorySelect) {
        foodCategorySelect.innerHTML = categoryOptions;
    }
}

/**
 * Load menu items from API with LocalStorage fallback
 */
async function loadMenuItems() {
    try {
        const response = await fetch('/api/menu');
        if (!response.ok) throw new Error("API offline");
        
        menuItems = await response.json();
        localStorage.setItem("systemMenuItems", JSON.stringify(menuItems));
    } catch (error) {
        console.warn("Menu API offline. Using LocalStorage fallback.");
        const storedMenu = localStorage.getItem("systemMenuItems");
        if (storedMenu) {
            menuItems = JSON.parse(storedMenu);
        } else {
            menuItems = [
                { id: "FOOD-101", name: "Doro Wat", category: "Lunch", price: 250, description: "Spicy traditional Ethiopian chicken stew.", available: true },
                { id: "FOOD-102", name: "Beef Tibs", category: "Lunch", price: 280, description: "Sautéed beef with onions and green peppers.", available: true },
                { id: "FOOD-103", name: "Shiro Tagamino", category: "Lunch", price: 120, description: "Slow-cooked chickpea flour stew.", available: true },
                { id: "FOOD-104", name: "Special Chechebsa", category: "Breakfast", price: 150, description: "Flatbread fried with spiced butter and honey.", available: false }
            ];
            localStorage.setItem("systemMenuItems", JSON.stringify(menuItems));
        }
    }

    renderMenuTable(menuItems);
}

/**
 * Render menu items into the admin table
 */
function renderMenuTable(itemsToRender) {
    const tbody = document.getElementById("menuTableBody");
    if (!tbody) return;

    if (itemsToRender.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: #9ca3af; padding: 20px;">No menu items found.</td></tr>`;
        return;
    }

    tbody.innerHTML = itemsToRender.map(item => {
        const isAvailable = item.available ?? item.isAvailable;
        const availBadge = isAvailable ? "paid" : "cancelled";
        const availText = isAvailable ? "Available" : "Out of Stock";

        return `
            <tr>
                <td>
                    <strong>${item.name}</strong><br>
                    <small style="color: #6b7280;">${item.description || "No description"}</small>
                </td>
                <td><span class="status-pill preparing">${item.category}</span></td>
                <td><strong>${item.price} ETB</strong></td>
                <td>
                    <button class="status-pill ${availBadge}" style="border:none; cursor:pointer;" onclick="toggleAvailability('${item.id}')">
                        ${availText}
                    </button>
                </td>
                <td>
                    <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.8rem;" onclick="openEditFoodModal('${item.id}')">
                        <i class="fa-solid fa-pen-to-square"></i> Edit
                    </button>
                    <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.8rem; color: var(--color-danger);" onclick="deleteFoodItem('${item.id}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

/**
 * Filter items by Search input and Category select
 */
function setupFilterEvents() {
    const searchInput = document.getElementById("menuSearchInput");
    const categorySelect = document.getElementById("categoryFilterSelect");

    const applyFilters = () => {
        const query = searchInput ? searchInput.value.toLowerCase() : "";
        const category = categorySelect ? categorySelect.value : "all";

        const filtered = menuItems.filter(item => {
            const matchesQuery = item.name.toLowerCase().includes(query);
            const matchesCat = category === "all" || item.category === category;
            return matchesQuery && matchesCat;
        });

        renderMenuTable(filtered);
    };

    if (searchInput) searchInput.addEventListener("input", applyFilters);
    if (categorySelect) categorySelect.addEventListener("change", applyFilters);
}

/**
 * Toggle item availability (API + LocalStorage fallback)
 */
window.toggleAvailability = async function(foodId) {
    const item = menuItems.find(f => String(f.id) === String(foodId));
    if (!item) return;

    const updatedStatus = !(item.available ?? item.isAvailable);
    item.available = updatedStatus;
    item.isAvailable = updatedStatus;

    try {
        await fetch(`/api/menu/${foodId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ available: updatedStatus })
        });
    } catch (error) {
        console.warn("Server unavailable. Updated status locally.", error);
    }

    saveAndReloadMenu();
};

/**
 * Delete food item (API + LocalStorage fallback)
 */
window.deleteFoodItem = async function(foodId) {
    if (!confirm("Are you sure you want to delete this menu item?")) return;

    try {
        await fetch(`/api/menu/${foodId}`, { method: 'DELETE' });
    } catch (error) {
        console.warn("Server unavailable. Deleted item locally.", error);
    }

    menuItems = menuItems.filter(f => String(f.id) !== String(foodId));
    saveAndReloadMenu();
};

/**
 * Populate and display modal for editing
 */
window.openEditFoodModal = function(foodId) {
    const item = menuItems.find(f => String(f.id) === String(foodId));
    if (!item) return;

    document.getElementById("modalTitle").innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Edit Food Item`;
    document.getElementById("foodId").value = item.id;
    document.getElementById("foodName").value = item.name;
    document.getElementById("foodCategory").value = item.category;
    document.getElementById("foodPrice").value = item.price;
    document.getElementById("foodDescription").value = item.description || "";
    document.getElementById("foodAvailability").value = (item.available ?? item.isAvailable).toString();

    document.getElementById("foodModal").classList.add("active");
};

/**
 * Modal event handlers & form submission (Add/Edit via API + Local fallback)
 */
function setupModalEvents() {
    const modal = document.getElementById("foodModal");
    const openBtn = document.getElementById("openAddFoodModalBtn");
    const closeBtn = document.getElementById("closeFoodModalBtn");
    const cancelBtn = document.getElementById("cancelFoodModalBtn");
    const form = document.getElementById("foodForm");

    const closeModal = () => {
        modal.classList.remove("active");
        form.reset();
        document.getElementById("foodId").value = "";
    };

    if (openBtn) {
        openBtn.addEventListener("click", () => {
            document.getElementById("modalTitle").innerHTML = `<i class="fa-solid fa-bowl-food"></i> Add Food Item`;
            form.reset();
            modal.classList.add("active");
        });
    }

    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const id = document.getElementById("foodId").value;
            const payload = {
                name: document.getElementById("foodName").value,
                category: document.getElementById("foodCategory").value,
                price: parseFloat(document.getElementById("foodPrice").value),
                description: document.getElementById("foodDescription").value,
                available: document.getElementById("foodAvailability").value === "true"
            };

            if (id) {
                // Update item
                try {
                    await fetch(`/api/menu/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                } catch (error) {
                    console.warn("Server unavailable. Saved edit locally.", error);
                }

                const item = menuItems.find(f => String(f.id) === String(id));
                if (item) {
                    Object.assign(item, payload, { isAvailable: payload.available });
                }
            } else {
                // Create item
                let newItem = { ...payload, id: "FOOD-" + Math.floor(100 + Math.random() * 900) };
                try {
                    const response = await fetch('/api/menu', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (response.ok) {
                        const savedItem = await response.json();
                        if (savedItem && savedItem.id) newItem = savedItem;
                    }
                } catch (error) {
                    console.warn("Server unavailable. Saved new item locally.", error);
                }
                menuItems.unshift(newItem);
            }

            saveAndReloadMenu();
            closeModal();
        });
    }
}

/**
 * Save updated menu to LocalStorage and refresh DOM
 */
function saveAndReloadMenu() {
    localStorage.setItem("systemMenuItems", JSON.stringify(menuItems));
    renderMenuTable(menuItems);
}