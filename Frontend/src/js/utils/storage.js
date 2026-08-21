/**
 * LocalStorage Utility Wrapper
 */
export const Storage = {
    // Save data to localStorage
    set(key, value) {
        try {
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(key, serializedValue);
        } catch (error) {
            console.error(`Error saving key "${key}" to Storage:`, error);
        }
    },

    // Retrieve data from localStorage
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`Error reading key "${key}" from Storage:`, error);
            return defaultValue;
        }
    },

    // Remove a specific key from localStorage
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error(`Error removing key "${key}" from Storage:`, error);
        }
    },

    // Clear all localStorage data
    clear() {
        try {
            localStorage.clear();
        } catch (error) {
            console.error("Error clearing Storage:", error);
        }
    }
};