/**
 * ================================================================
 * SMART CAFETERIA ORDERING SYSTEM - ADMIN MENU MANAGEMENT
 * ================================================================
 * Driven by the live backend API (via AdminAPI):
 *   GET    /admin/menu               (list / search / filter / paginate)
 *   GET    /admin/menu/stats         (metric cards)
 *   POST   /admin/menu               (create)
 *   PUT    /admin/menu/:id           (update)
 *   PATCH  /admin/menu/:id/availability (toggle availability)
 *   DELETE /admin/menu/:id           (delete)
 *   GET    /categories               (populate category dropdowns)
 *
 * Requires window.AdminAPI (admin-api.js) loaded first.
 * ================================================================
 */
(function () {
  "use strict";

  var state = {
    page: 1,
    limit: 10,
    search: "",
    category: "",
    availability: "",
    sort: "newest"
  };

  var VALID_CATEGORIES = [
    "breakfast", "mains", "main-meals", "fasting",
    "beverages", "snacks", "Lunch", "Dinner", "Drinks"
  ];

  var categoryOptions = [];

  function money(value) {
    if (value === null || value === undefined) return "0.00";
    return Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function esc(value) {
    return window.esc(value);
  }

  function categoryLabel(cat) {
    var found = categoryOptions.find(function (c) {
      return String(c.id).toLowerCase() === String(cat).toLowerCase() ||
             String(c.name).toLowerCase() === String(cat).toLowerCase();
    });
    if (found) return found.name;
    return cat || "—";
  }

  function itemImage(item) {
    var src = item.image
      ? (item.image.indexOf("http") === 0 ? item.image : "https://smart-cafeteria-frontend.onrender.com" + item.image)
      : "/assets/images/default-food.png";
    return '<img class="food-image-thumb" src="' + esc(src) + '" alt="' + esc(item.name.en) + '" onerror="this.onerror=null; this.src=\'https://via.placeholder.com/50?text=Food\';" loading="lazy">';
  }

  function availabilityBadge(item) {
    var available = item.availability && item.isAvailable;
    var cls = available ? "order-badge avail-on" : "order-badge avail-off";
    return '<span class="' + cls + '">' + (available ? "Available" : "Unavailable") + "</span>";
  }

  /* ============================================================
   * CATEGORIES
   * ============================================================ */
  async function loadCategories() {
    try {
      var data = await window.AdminAPI.get("/categories");
      var cats = (data && data.categories) || [];
      categoryOptions = cats.map(function (c) {
        return {
          id: c.id,
          name: (c.name && (c.name.en || c.name)) || c.id
        };
      });
      if (categoryOptions.length === 0) {
        categoryOptions = VALID_CATEGORIES.map(function (c) { return { id: c, name: c }; });
      }
    } catch (e) {
      categoryOptions = VALID_CATEGORIES.map(function (c) { return { id: c, name: c }; });
    }
    populateCategorySelects();
  }

  function populateCategorySelects() {
    var optionsHtml = categoryOptions
      .map(function (c) { return '<option value="' + esc(c.id) + '">' + esc(c.name) + "</option>"; })
      .join("");

    var filter = document.getElementById("categoryFilter");
    if (filter) filter.innerHTML = '<option value="">All Categories</option>' + optionsHtml;

    var formSelect = document.getElementById("itemCategory");
    if (formSelect) formSelect.innerHTML = '<option value="">Select category</option>' + optionsHtml;
  }

  /* ============================================================
   * STATS
   * ============================================================ */
  async function loadStats() {
    try {
      var data = await window.AdminAPI.get("/admin/menu/stats");
      var stats = (data && data.stats) || {};
      setText("metricTotalItems", stats.totalItems || 0);
      setText("metricAvailableItems", stats.availableItems || 0);
      setText("metricOutOfStockItems", stats.outOfStockItems || 0);
      setText("metricTotalCategories", stats.totalCategories || 0);
    } catch (e) {
      // stats are supplementary
    }
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  /* ============================================================
   * TABLE
   * ============================================================ */
  function availabilityQueryValue() {
    if (state.availability === "AVAILABLE") return "available";
    if (state.availability === "OUT_OF_STOCK") return "out_of_stock";
    return "";
  }

  async function loadMenuItems() {
    var tbody = document.getElementById("menuTableBody");
    if (!tbody || !window.AdminAPI) return;

    tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Loading menu items...</td></tr>';

    try {
      var data = await window.AdminAPI.get("/admin/menu", {
        page: state.page,
        limit: state.limit,
        search: state.search,
        category: state.category,
        availability: availabilityQueryValue(),
        sort: state.sort
      });

      var items = (data && data.items) || [];
      renderMenuItems(items);

      var total = data.total || 0;
      var pages = Math.max((data && data.pages) || 1, 1);
      var info = document.getElementById("menuPaginationControls");
      if (info) renderPagination(info, data.page || state.page, pages, total);
      state.page = (data && data.page) || 1;
    } catch (error) {
      tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Failed to load menu: ' + esc(error.message || "Server error") + "</td></tr>";
    }
  }

  function renderMenuItems(items) {
    var tbody = document.getElementById("menuTableBody");
    if (!tbody) return;

    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="table-empty">No menu items found.</td></tr>';
      return;
    }

    tbody.innerHTML = items.map(function (item) {
      var available = item.availability && item.isAvailable;
      var toggleBtn =
        '<button class="action-btn" data-action="toggle" data-id="' + esc(item.id) + '" title="' +
        (available ? "Make unavailable" : "Make available") + '">' +
        '<i class="fa-solid ' + (available ? "fa-circle-xmark" : "fa-circle-check") + '"></i></button>';

      return (
        "<tr>" +
        "<td><strong>#" + esc(String(item.id).slice(-6).toUpperCase()) + "</strong></td>" +
        "<td>" +
          '<div class="user-cell">' +
            itemImage(item) +
            "<div><strong>" + esc(item.name.en) + "</strong>" +
            (item.name.am ? "<small>" + esc(item.name.am) + "</small>" : "") +
            "</div>" +
          "</div>" +
        "</td>" +
        '<td><span class="cat-pill">' + esc(categoryLabel(item.category)) + "</span></td>" +
        "<td><strong>" + money(item.price) + " ETB</strong></td>" +
        "<td>" + availabilityBadge(item) + "</td>" +
        "<td>" +
          '<div class="table-actions">' +
            '<button class="action-btn" data-action="edit" data-id="' + esc(item.id) + '" title="Edit item"><i class="fa-solid fa-pen"></i></button>' +
            toggleBtn +
            '<button class="action-btn danger" data-action="delete" data-id="' + esc(item.id) + '" title="Delete item"><i class="fa-solid fa-trash"></i></button>' +
          "</div>" +
        "</td>" +
        "</tr>"
      );
    }).join("");
  }

  function renderPagination(container, page, pages, total) {
    container.innerHTML =
      '<div class="pagination-info">Page ' + page + " of " + pages + " (" + total + " items)</div>" +
      '<div class="pagination">' +
        '<button class="page-btn" id="menuPrevPageBtn"' + (page <= 1 ? " disabled" : "") + '><i class="fa-solid fa-chevron-left"></i> Prev</button>' +
        '<button class="page-btn" id="menuNextPageBtn"' + (page >= pages ? " disabled" : "") + '>Next <i class="fa-solid fa-chevron-right"></i></button>' +
      "</div>";

    var prevBtn = document.getElementById("menuPrevPageBtn");
    var nextBtn = document.getElementById("menuNextPageBtn");
    if (prevBtn) prevBtn.addEventListener("click", function () { changePage(-1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { changePage(1); });
  }

  function changePage(delta) {
    state.page += delta;
    if (state.page < 1) state.page = 1;
    loadMenuItems();
  }

  /* ============================================================
   * ADD / EDIT MODAL
   * ============================================================ */
  function openModal() {
    var modal = document.getElementById("menuModal");
    if (modal) modal.style.display = "flex";
  }

  function closeModal() {
    var modal = document.getElementById("menuModal");
    if (modal) modal.style.display = "none";
  }

  function openAddItemModal() {
    var form = document.getElementById("menuForm");
    if (form) form.reset();
    document.getElementById("itemId").value = "";
    document.getElementById("itemIsAvailable").checked = true;
    document.getElementById("menuModalTitle").textContent = "Add New Menu Item";
    document.getElementById("saveMenuBtn").textContent = "Save Item";
    openModal();
  }

  function openEditItemModal(item) {
    document.getElementById("itemId").value = item.id;
    document.getElementById("itemName").value = item.name.en || "";
    document.getElementById("itemCategory").value = item.category;
    document.getElementById("itemPrice").value = item.price;
    document.getElementById("itemImageUrl").value = item.image || "";
    document.getElementById("itemDescription").value = (item.description && item.description.en) || "";
    document.getElementById("itemIsAvailable").checked = !!(item.availability && item.isAvailable);
    document.getElementById("menuModalTitle").textContent = "Edit Menu Item";
    document.getElementById("saveMenuBtn").textContent = "Update Item";
    openModal();
  }

  function buildPayload() {
    var nameEn = document.getElementById("itemName").value.trim();
    var nameAm = document.getElementById("itemNameAm") ? document.getElementById("itemNameAm").value.trim() : nameEn;
    var descEn = document.getElementById("itemDescription").value.trim();
    var descAm = document.getElementById("itemDescriptionAm") ? document.getElementById("itemDescriptionAm").value.trim() : descEn;

    return {
      name: { en: nameEn, am: nameAm },
      category: document.getElementById("itemCategory").value,
      price: parseFloat(document.getElementById("itemPrice").value),
      description: { en: descEn, am: descAm },
      available: document.getElementById("itemIsAvailable").checked
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();

    var payload = buildPayload();
    if (!payload.name.en || !payload.name.am) {
      if (window.AdminToast) window.AdminToast.error("Both English and Amharic names are required");
      return;
    }
    if (isNaN(payload.price) || payload.price < 0) {
      if (window.AdminToast) window.AdminToast.error("Price must be a non-negative number");
      return;
    }

    // ✅ Handle file upload + image URL
    var formData = new FormData();
    formData.append('name', JSON.stringify(payload.name));
    formData.append('category', payload.category);
    formData.append('price', payload.price);
    formData.append('description', JSON.stringify(payload.description));
    formData.append('available', payload.available);

    var imageFileInput = document.getElementById("itemImageFile");
    if (imageFileInput && imageFileInput.files && imageFileInput.files[0]) {
      // File upload takes priority
      formData.append('image', imageFileInput.files[0]);
    } else {
      // Fall back to image URL if no file selected
      var imageUrlVal = document.getElementById("itemImageUrl").value.trim();
      if (imageUrlVal) {
        formData.append('imageUrl', imageUrlVal);
      }
    }

    var id = document.getElementById("itemId").value;

    try {
      if (id) {
        // For PUT requests, add the ID to the form data
        formData.append('_id', id);
        await window.AdminAPI.putFormData("/admin/menu/" + id, formData);
        if (window.AdminToast) window.AdminToast.success("Menu item updated");
      } else {
        await window.AdminAPI.postFormData("/admin/menu", formData);
        if (window.AdminToast) window.AdminToast.success("Menu item added");
      }
      closeModal();
      if (state.page > 1 && !id) state.page = 1;
      loadMenuItems();
      loadStats();
    } catch (error) {
      if (window.AdminToast) window.AdminToast.error(error.message || "Failed to save menu item");
    }
  }

  /* ============================================================
   * ACTIONS
   * ============================================================ */
  async function toggleAvailability(item) {
    var available = item.availability && item.isAvailable;
    var label = available ? "Make unavailable (" + item.name.en + ")?" : "Make available (" + item.name.en + ")?";
    if (!window.confirm(label)) return;

    try {
      await window.AdminAPI.patch("/admin/menu/" + item.id + "/availability", { available: !available });
      if (window.AdminToast) window.AdminToast.success(!available ? "Item is now available" : "Item is now unavailable");
      loadMenuItems();
      loadStats();
    } catch (error) {
      if (window.AdminToast) window.AdminToast.error(error.message || "Failed to update availability");
    }
  }

  async function deleteMenuItem(item) {
    if (!window.confirm('Delete "' + item.name.en + '" from the menu? This cannot be undone.')) return;

    try {
      await window.AdminAPI.del("/admin/menu/" + item.id);
      if (window.AdminToast) window.AdminToast.success("Menu item deleted");
      loadMenuItems();
      loadStats();
    } catch (error) {
      if (window.AdminToast) window.AdminToast.error(error.message || "Failed to delete menu item");
    }
  }

  /* ============================================================
   * EVENT BINDINGS
   * ============================================================ */
  function bindEvents() {
    var addBtn = document.getElementById("openAddMenuModalBtn");
    if (addBtn) addBtn.addEventListener("click", openAddItemModal);

    var closeBtn = document.getElementById("closeMenuModalBtn");
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    var cancelBtn = document.getElementById("cancelMenuModalBtn");
    if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
    var modal = document.getElementById("menuModal");
    if (modal) {
      modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
    }

    var form = document.getElementById("menuForm");
    if (form) form.addEventListener("submit", handleSubmit);

    var searchInput = document.getElementById("menuSearchInput");
    if (searchInput) {
      var debounceTimer = null;
      searchInput.addEventListener("input", function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () {
          state.search = searchInput.value.trim();
          state.page = 1;
          loadMenuItems();
        }, 400);
      });
    }

    var categoryFilter = document.getElementById("categoryFilter");
    if (categoryFilter) {
      categoryFilter.addEventListener("change", function () {
        state.category = categoryFilter.value;
        state.page = 1;
        loadMenuItems();
      });
    }

    var availabilityFilter = document.getElementById("availabilityFilter");
    if (availabilityFilter) {
      availabilityFilter.addEventListener("change", function () {
        state.availability = availabilityFilter.value;
        state.page = 1;
        loadMenuItems();
      });
    }

    var tbody = document.getElementById("menuTableBody");
    if (tbody) {
      tbody.addEventListener("click", async function (e) {
        var btn = e.target.closest("[data-action]");
        if (!btn) return;
        var id = btn.getAttribute("data-id");
        var action = btn.getAttribute("data-action");
        if (!id) return;

        var item = null;
        try {
          var d = await window.AdminAPI.get("/admin/menu/" + id);
          item = d.item;
        } catch (err) { /* not found */ }
        if (!item) {
          if (window.AdminToast) window.AdminToast.error("Menu item not found");
          return;
        }

        if (action === "edit") openEditItemModal(item);
        else if (action === "toggle") toggleAvailability(item);
        else if (action === "delete") deleteMenuItem(item);
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!window.AdminAPI) return;
    bindEvents();
    loadCategories().then(function () {
      loadMenuItems();
      loadStats();
    });
  });
})();