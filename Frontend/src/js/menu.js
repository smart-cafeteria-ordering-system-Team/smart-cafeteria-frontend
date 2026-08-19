/**
 * ================================================================
 * SMART CAFETERIA ORDERING SYSTEM - MENU MODULE
 * ================================================================
 * Handles menu browsing, searching, filtering, and item details.
 * ================================================================
 */

import { MENU_ITEMS, MENU_CATEGORIES } from "./config.js";
import { showToast } from "./main.js";

// ===== 1. MENU STATE =====

let menuItems = Array.isArray(MENU_ITEMS) ? [...MENU_ITEMS] : [];
let selectedCategory = null;
let searchQuery = "";
let sortBy = "name";

// ===== 2. MENU FUNCTIONS =====

/**
 * Get all menu items
 *
 * @param {Object} filters - Filter options
 * @param {string} filters.category - Category ID
 * @param {string} filters.search - Search query
 * @param {string} filters.sort - Sort method
 * @param {boolean} filters.available - Availability filter
 * @returns {Array} Filtered and sorted menu items
 */
export function getMenuItems(filters = {}) {
  let items = [...menuItems];

  // ------------------------------------------------------------
  // Filter by category
  // ------------------------------------------------------------

  if (filters.category) {
    items = items.filter((item) => item.category === filters.category);
  } else if (selectedCategory) {
    items = items.filter((item) => item.category === selectedCategory);
  }

  // ------------------------------------------------------------
  // Filter by search query
  // ------------------------------------------------------------

  const query = filters.search !== undefined ? filters.search : searchQuery;

  if (query && query.trim() !== "") {
    const q = query.trim().toLowerCase();

    items = items.filter((item) => {
      const englishName = item.name?.en?.toLowerCase() || "";

      const amharicName = item.name?.am || "";

      const englishDescription = item.description?.en?.toLowerCase() || "";

      const amharicDescription = item.description?.am || "";

      return (
        englishName.includes(q) ||
        amharicName.includes(q) ||
        englishDescription.includes(q) ||
        amharicDescription.includes(q)
      );
    });
  }

  // ------------------------------------------------------------
  // Filter availability
  // ------------------------------------------------------------

  if (filters.available !== undefined) {
    items = items.filter((item) => item.availability === filters.available);
  }

  // ------------------------------------------------------------
  // Sort
  // ------------------------------------------------------------

  const sortMethod = filters.sort || sortBy;

  switch (sortMethod) {
    case "name":
      items.sort((a, b) => {
        const nameA = a.name?.en || "";
        const nameB = b.name?.en || "";

        return nameA.localeCompare(nameB);
      });
      break;

    case "price-low":
      items.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
      break;

    case "price-high":
      items.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
      break;

    case "popular":
      items.sort((a, b) => Number(a.id || 0) - Number(b.id || 0));
      break;

    default:
      break;
  }

  return items;
}

/**
 * Get a single menu item by ID
 *
 * @param {number|string} id - Item ID
 * @returns {Object|null} Menu item or null
 */
export function getMenuItemById(id) {
  const numericId = typeof id === "string" ? parseInt(id, 10) : id;

  return (
    menuItems.find((item) => Number(item.id) === Number(numericId)) || null
  );
}

/**
 * Get menu items by category
 *
 * @param {string} categoryId - Category ID
 * @returns {Array} Menu items in category
 */
export function getMenuItemsByCategory(categoryId) {
  return menuItems.filter((item) => item.category === categoryId);
}

/**
 * Get all categories with item counts
 *
 * @param {string} language - 'en' or 'am'
 * @returns {Array} Categories with counts
 */
export function getCategories(language = "en") {
  if (!Array.isArray(MENU_CATEGORIES)) {
    return [];
  }

  return MENU_CATEGORIES.map((category) => {
    const count = menuItems.filter(
      (item) => item.category === category.id,
    ).length;

    return {
      ...category,
      name: category.name?.[language] || category.name?.en || category.id,
      count,
    };
  });
}

/**
 * Get category by ID
 *
 * @param {string} categoryId - Category ID
 * @param {string} language - 'en' or 'am'
 * @returns {Object|null} Category object
 */
export function getCategoryById(categoryId, language = "en") {
  const category = MENU_CATEGORIES.find((cat) => cat.id === categoryId);

  if (!category) {
    return null;
  }

  return {
    ...category,
    name: category.name?.[language] || category.name?.en || category.id,
  };
}

/**
 * Search menu items
 *
 * @param {string} query - Search query
 * @returns {Array} Matching menu items
 */
export function searchMenuItems(query) {
  if (!query || query.trim() === "") {
    return getMenuItems();
  }

  return getMenuItems({
    search: query,
  });
}

/**
 * Set category filter
 *
 * @param {string|null} categoryId
 */
export function setCategoryFilter(categoryId) {
  selectedCategory = categoryId && categoryId.trim() !== "" ? categoryId : null;
}

/**
 * Get current category filter
 *
 * @returns {string|null}
 */
export function getCategoryFilter() {
  return selectedCategory;
}

/**
 * Clear category filter
 */
export function clearCategoryFilter() {
  selectedCategory = null;
}

/**
 * Set search query
 *
 * @param {string} query
 */
export function setSearchQuery(query) {
  searchQuery = typeof query === "string" ? query : "";
}

/**
 * Get current search query
 *
 * @returns {string}
 */
export function getSearchQuery() {
  return searchQuery;
}

/**
 * Clear search query
 */
export function clearSearchQuery() {
  searchQuery = "";
}

/**
 * Set sort method
 *
 * @param {string} sort
 */
export function setSortMethod(sort) {
  const validSortMethods = ["name", "price-low", "price-high", "popular"];

  if (validSortMethods.includes(sort)) {
    sortBy = sort;
  }
}

/**
 * Get current sort method
 *
 * @returns {string}
 */
export function getSortMethod() {
  return sortBy;
}

/**
 * Get featured/popular menu items
 *
 * @param {number} limit
 * @returns {Array}
 */
export function getFeaturedItems(limit = 6) {
  const safeLimit = Math.max(0, Number(limit) || 6);

  return menuItems.slice(0, safeLimit);
}

/**
 * Get related items
 *
 * @param {number|string} itemId
 * @param {number} limit
 * @returns {Array}
 */
export function getRelatedItems(itemId, limit = 4) {
  const item = getMenuItemById(itemId);

  if (!item) {
    return [];
  }

  const safeLimit = Math.max(0, Number(limit) || 4);

  return menuItems
    .filter(
      (menuItem) =>
        menuItem.id !== item.id && menuItem.category === item.category,
    )
    .slice(0, safeLimit);
}

/**
 * Get available items count
 *
 * @returns {number}
 */
export function getAvailableCount() {
  return menuItems.filter((item) => item.availability === true).length;
}

/**
 * Get total items count
 *
 * @returns {number}
 */
export function getTotalCount() {
  return menuItems.length;
}

/**
 * Get price range
 *
 * @returns {Object} { min, max }
 */
export function getPriceRange() {
  if (menuItems.length === 0) {
    return {
      min: 0,
      max: 0,
    };
  }

  const prices = menuItems
    .map((item) => Number(item.price))
    .filter((price) => Number.isFinite(price));

  if (prices.length === 0) {
    return {
      min: 0,
      max: 0,
    };
  }

  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}

// ===== 3. ADMIN MENU FUNCTIONS =====

/**
 * Add new menu item
 *
 * @param {Object} itemData
 * @returns {Promise<Object>}
 */
export async function addMenuItem(itemData = {}) {
  try {
    // --------------------------------------------------------
    // Validate required fields
    // --------------------------------------------------------

    if (!itemData.name || !itemData.price || !itemData.category) {
      return {
        success: false,
        error: "Name, price, and category are required",
      };
    }

    const numericPrice = Number(itemData.price);

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      return {
        success: false,
        error: "Price must be a valid positive number",
      };
    }

    // --------------------------------------------------------
    // Generate new ID safely
    // --------------------------------------------------------

    const existingIds = menuItems
      .map((item) => Number(item.id))
      .filter((id) => Number.isFinite(id));

    const newId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;

    // --------------------------------------------------------
    // Create menu item
    // --------------------------------------------------------

    const newItem = {
      id: newId,

      name: itemData.name,

      category: itemData.category,

      price: numericPrice,

      description: itemData.description || {
        en: "",
        am: "",
      },

      icon: itemData.icon || "🍽️",

      image: itemData.image || null,

      preparationTime: Number(itemData.preparationTime) || 10,

      availability:
        itemData.availability !== undefined
          ? Boolean(itemData.availability)
          : true,
    };

    menuItems.push(newItem);

    showToast("Menu item added successfully!", "success");

    return {
      success: true,
      item: newItem,
    };
  } catch (error) {
    console.error("Add menu item error:", error);

    return {
      success: false,
      error: "Failed to add menu item",
    };
  }
}

/**
 * Update menu item
 *
 * @param {number|string} id
 * @param {Object} updates
 * @returns {Promise<Object>}
 */
export async function updateMenuItem(id, updates = {}) {
  try {
    const numericId = typeof id === "string" ? parseInt(id, 10) : id;

    const index = menuItems.findIndex(
      (item) => Number(item.id) === Number(numericId),
    );

    if (index === -1) {
      return {
        success: false,
        error: "Item not found",
      };
    }

    // --------------------------------------------------------
    // Validate price if being updated
    // --------------------------------------------------------

    if (updates.price !== undefined) {
      const numericPrice = Number(updates.price);

      if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
        return {
          success: false,
          error: "Price must be a valid positive number",
        };
      }

      updates = {
        ...updates,
        price: numericPrice,
      };
    }

    // --------------------------------------------------------
    // Update item
    // --------------------------------------------------------

    menuItems[index] = {
      ...menuItems[index],
      ...updates,
    };

    showToast("Menu item updated successfully!", "success");

    return {
      success: true,
      item: menuItems[index],
    };
  } catch (error) {
    console.error("Update menu item error:", error);

    return {
      success: false,
      error: "Failed to update menu item",
    };
  }
}

/**
 * Delete menu item
 *
 * @param {number|string} id
 * @returns {Promise<Object>}
 */
export async function deleteMenuItem(id) {
  try {
    const numericId = typeof id === "string" ? parseInt(id, 10) : id;

    const index = menuItems.findIndex(
      (item) => Number(item.id) === Number(numericId),
    );

    if (index === -1) {
      return {
        success: false,
        error: "Item not found",
      };
    }

    const name = menuItems[index].name?.en || "Menu item";

    menuItems.splice(index, 1);

    showToast(`"${name}" removed from menu`, "info");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Delete menu item error:", error);

    return {
      success: false,
      error: "Failed to delete menu item",
    };
  }
}

/**
 * Toggle menu item availability
 *
 * @param {number|string} id
 * @returns {Promise<Object>}
 */
export async function toggleAvailability(id) {
  try {
    const numericId = typeof id === "string" ? parseInt(id, 10) : id;

    const item = getMenuItemById(numericId);

    if (!item) {
      return {
        success: false,
        error: "Item not found",
      };
    }

    const newAvailability = !Boolean(item.availability);

    return await updateMenuItem(numericId, {
      availability: newAvailability,
    });
  } catch (error) {
    console.error("Toggle availability error:", error);

    return {
      success: false,
      error: "Failed to toggle availability",
    };
  }
}

// ===== 4. RESET / UTILITY FUNCTIONS =====

/**
 * Reset menu filters
 */
export function resetMenuFilters() {
  selectedCategory = null;
  searchQuery = "";
  sortBy = "name";
}

/**
 * Get a copy of all raw menu items
 *
 * @returns {Array}
 */
export function getAllMenuItems() {
  return [...menuItems];
}

// ===== 5. DEFAULT EXPORT =====

export default {
  getMenuItems,
  getMenuItemById,
  getMenuItemsByCategory,

  getCategories,
  getCategoryById,

  searchMenuItems,

  setCategoryFilter,
  getCategoryFilter,
  clearCategoryFilter,

  setSearchQuery,
  getSearchQuery,
  clearSearchQuery,

  setSortMethod,
  getSortMethod,

  getFeaturedItems,
  getRelatedItems,

  getAvailableCount,
  getTotalCount,
  getPriceRange,

  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability,

  resetMenuFilters,
  getAllMenuItems,
};
