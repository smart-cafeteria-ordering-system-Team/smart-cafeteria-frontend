/**
 * ================================================================
 * SMART CAFETERIA ORDERING SYSTEM - FORMATTERS
 * ================================================================
 * Utility functions for formatting data for display.
 * ================================================================
 */

import { DEFAULT_SETTINGS } from '../config.js';

// ===== 1. CURRENCY FORMATTER =====
/**
 * Format price as currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: ETB)
 * @param {string} locale - Locale (default: en-US)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = 'ETB', locale = 'en-US') {
    if (amount === undefined  amount === null  isNaN(amount)) {
        return `0 ${currency}`;
    }

    const formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });

    let result = formatter.format(amount);
    // Replace currency symbol with custom symbol if needed
    if (currency === 'ETB') {
        result = result.replace(/ETB|Br/g, 'ብር');
    }
    return result;
}

/**
 * Format price as ETB (Ethiopian Birr)
 * @param {number} amount - Amount to format
 * @returns {string}
 */
export function formatETB(amount) {
    return formatCurrency(amount, 'ETB');
}

// ===== 2. DATE FORMATTER =====
/**
 * Format date to readable string
 * @param {string|Date} date - Date to format
 * @param {string} locale - Locale (default: en-US)
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatDate(date, locale = 'en-US', options = {}) {
    if (!date) return '—';

    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return 'Invalid Date';

    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        ...options,
    };

    const formatter = new Intl.DateTimeFormat(locale, defaultOptions);
    return formatter.format(d);
}

/**
 * Format date to short format (MMM DD, YYYY)
 * @param {string|Date} date - Date to format
 * @param {string} locale - Locale
 * @returns {string}
 */
export function formatDateShort(date, locale = 'en-US') {
    return formatDate(date, locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

/**
 * Format time only (HH:MM AM/PM)
 * @param {string|Date} date - Date to format
 * @param {string} locale - Locale
 * @returns {string}
 */
export function formatTime(date, locale = 'en-US') {
    return formatDate(date, locale, {
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Get relative time (e.g., "2 hours ago")
 * @param {string|Date} date - Date to format
 * @param {string} locale - Locale
 * @returns {string}
 */
export function formatRelativeTime(date, locale = 'en-US') {
    if (!date) return '—';

    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return 'Invalid Date';

    const now = new Date();
    const diffMs = now - d;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffWeek = Math.floor(diffDay / 7);

    const rtf = new Intl.RelativeTimeFormatter(locale, { numeric: 'auto' });

    if (diffSec < 60) return rtf.format(-diffSec, 'second');
    if (diffMin < 60) return rtf.format(-diffMin, 'minute');
    if (diffHour < 24) return rtf.format(-diffHour, 'hour');
    if (diffDay < 7) return rtf.format(-diffDay, 'day');
    return rtf.format(-diffWeek, 'week');
}

// ===== 3. ORDER STATUS FORMATTER =====
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../config.js';
/**
 * Get localized status label
 * @param {string} status - Status key
 * @param {string} language - 'en' or 'am'
 * @returns {string}
 */
export function formatOrderStatus(status, language = 'en') {
    const labels = ORDER_STATUS_LABELS[status];
    if (!labels) return status;
    return labels[language] || labels.en;
}

/**
 * Get status color class
 * @param {string} status - Status key
 * @returns {string}
 */
export function formatOrderStatusColor(status) {
    return ORDER_STATUS_COLORS[status] || 'gray';
}

// ===== 4. TEXT FORMATTERS =====
/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length (default: 50)
 * @param {string} suffix - Suffix to add (default: ...)
 * @returns {string}
 */
export function truncateText(text, maxLength = 50, suffix = '...') {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + suffix;
}

/**
 * Capitalize first letter of each word
 * @param {string} text - Text to capitalize
 * @returns {string}
 */
export function capitalizeWords(text) {
    if (!text) return '';
    return text.replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Capitalize first letter only
 * @param {string} text - Text to capitalize
 * @returns {string}
 */
export function capitalizeFirst(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Convert to title case
 * @param {string} text - Text to convert
 * @returns {string}
 */
export function toTitleCase(text) {
    if (!text) return '';
    const exceptions = ['and', 'or', 'but', 'for', 'nor', 'on', 'at', 'to', 'by', 'in', 'with', 'without'];
    return text
        .toLowerCase()
        .split(' ')
        .map((word, index) => {
            if (index > 0 && exceptions.includes(word)) return word;
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
}

// ===== 5. NUMBER FORMATTERS =====
/**
 * Format number with commas
 * @param {number} num - Number to format
 * @param {number} decimals - Number of decimals (default: 0)
 * @param {string} locale - Locale (default: en-US)
 * @returns {string}
 */
export function formatNumber(num, decimals = 0, locale = 'en-US') {
    if (num === undefined  num === null  isNaN(num)) return '0';

    const formatter = new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
    return formatter.format(num);
}

/**
 * Format number as percentage
 * @param {number} num - Number to format
 * @param {number} decimals - Number of decimals (default: 0)
 * @param {string} locale - Locale
 * @returns {string}
 */
export function formatPercent(num, decimals = 0, locale = 'en-US') {
    if (num === undefined  num === null  isNaN(num)) return '0%';

    const formatter = new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
    return formatter.format(num / 100);
}

// ===== 6. PHONE FORMATTER =====
/**
 * Format phone number
 * @param {string} phone - Phone number to format
 * @returns {string}
 */
export function formatPhone(phone) {
    if (!phone) return '';
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 10) {
        return +251 ${clean.slice(1, 4)} ${clean.slice(4, 7)} ${clean.slice(7)};
    }
    if (clean.length === 9) {
        return +251 ${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)};
    }
    return phone;
}

// ===== 7. EXPORT ALL =====
export default {
    formatCurrency,
    formatETB,
    formatDate,
    formatDateShort,
    formatTime,
    formatRelativeTime,
    formatOrderStatus,
    formatOrderStatusColor,
    truncateText,
    capitalizeWords,
    capitalizeFirst,
    toTitleCase,
    formatNumber,
    formatPercent,
    formatPhone,
};