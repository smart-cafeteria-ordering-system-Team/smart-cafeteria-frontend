/**
 * Data and Text Formatting Utilities
 */
export const Formatters = {
    // Format number to currency (e.g., 150 -> ETB 150.00)
    formatCurrency(amount, currencySymbol = "ETB") {
        const numericAmount = Number(amount) || 0;
        return `${currencySymbol} ${numericAmount.toFixed(2)}`;
    },

    // Format ISO date string into readable time (e.g., 10:14 AM)
    formatTime(dateString) {
        const date = dateString ? new Date(dateString) : new Date();
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },

    // Format ISO date string into readable date (e.g., Aug 15, 2026)
    formatDate(dateString) {
        const date = dateString ? new Date(dateString) : new Date();
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
};