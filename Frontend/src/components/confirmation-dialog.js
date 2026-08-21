/**
 * ================================================================
 * SMART CAFETERIA ORDERING SYSTEM - CONFIRMATION DIALOG COMPONENT
 * ================================================================
 * Pure UI Component - Renders a confirmation dialog using modal.
 * ================================================================
 */

import { createModal } from './modal.js';

/**
 * Create confirmation dialog HTML
 * @param {Object} options - Dialog configuration
 * @param {string} options.id - Dialog ID
 * @param {string} options.title - Dialog title
 * @param {string} options.message - Dialog message
 * @param {string} options.icon - Icon class
 * @param {string} options.iconColor - Icon color
 * @param {string} options.confirmLabel - Confirm button label
 * @param {string} options.cancelLabel - Cancel button label
 * @param {string} options.confirmVariant - 'primary', 'danger', 'success'
 * @param {Function} options.onConfirm - Confirm callback
 * @param {Function} options.onCancel - Cancel callback
 * @param {boolean} options.isOpen - Open state
 * @returns {string} Confirmation dialog HTML
 */
export function createConfirmationDialog(options = {}) {
    const {
        id = 'confirm-' + Date.now(),
        title = 'Are you sure?',
        message = 'This action cannot be undone.',
        icon = 'fa-exclamation-triangle',
        iconColor = '#f59e0b',
        confirmLabel = 'Confirm',
        cancelLabel = 'Cancel',
        confirmVariant = 'danger',
        onConfirm = null,
        onCancel = null,
        isOpen = false,
    } = options;

    const content = `
        <div style="text-align:center; padding:8px 0;">
            <div style="font-size:48px; color:${iconColor}; margin-bottom:12px;">
                <i class="fas ${icon}"></i>
            </div>
            <p style="font-size:15px; color:var(--gray-600); margin:0;">
                ${message}
            </p>
        </div>
    `;

    return createModal({
        id: id,
        title: title,
        content: content,
        size: 'sm',
        isOpen: isOpen,
        onClose: onCancel,
        onConfirm: onConfirm,
        confirmLabel: confirmLabel,
        cancelLabel: cancelLabel,
        confirmVariant: confirmVariant,
        showClose: true,
        closeOnOverlay: true,
    });
}

/**
 * Show a confirmation dialog programmatically
 * @param {Object} options - Dialog options
 * @param {string} options.title - Dialog title
 * @param {string} options.message - Dialog message
 * @param {string} options.icon - Icon class
 * @param {string} options.iconColor - Icon color
 * @param {string} options.confirmLabel - Confirm button label
 * @param {string} options.cancelLabel - Cancel button label
 * @param {string} options.confirmVariant - 'primary', 'danger', 'success'
 * @param {Function} options.onConfirm - Confirm callback
 * @param {Function} options.onCancel - Cancel callback
 * @returns {Promise} Resolves with user choice
 */
export function showConfirmationDialog(options = {}) {
    return new Promise((resolve) => {
        const {
            title = 'Are you sure?',
            message = 'This action cannot be undone.',
            icon = 'fa-exclamation-triangle',
            iconColor = '#f59e0b',
            confirmLabel = 'Confirm',
            cancelLabel = 'Cancel',
            confirmVariant = 'danger',
        } = options;

        const id = 'confirm-' + Date.now();

        // Create container
        const container = document.createElement('div');
        container.id = 'confirm-container-' + id;
        document.body.appendChild(container);

        // Render dialog
        const dialogHTML = createConfirmationDialog({
            id: id,
            title: title,
            message: message,
            icon: icon,
            iconColor: iconColor,
            confirmLabel: confirmLabel,
            cancelLabel: cancelLabel,
            confirmVariant: confirmVariant,
            isOpen: true,
            onConfirm: () => {
                const overlay = document.getElementById(id + '-overlay');
                if (overlay) overlay.classList.remove('open');
                setTimeout(() => {
                    container.remove();
                    resolve(true);
                }, 300);
            },
            onCancel: () => {
                const overlay = document.getElementById(id + '-overlay');
                if (overlay) overlay.classList.remove('open');
                setTimeout(() => {
                    container.remove();
                    resolve(false);
                }, 300);
            },
        });

        container.innerHTML = dialogHTML;

        // Attach event listeners for escape and overlay clicks
        const overlay = document.getElementById(id + '-overlay');
        if (overlay) {
            overlay.addEventListener('click', function(e) {
                if (e.target === overlay) {
                    const confirmBtn = overlay.querySelector('.modal-confirm-btn');
                    if (confirmBtn) {
                        // Don't close on overlay click, use cancel instead
                        const cancelBtn = overlay.querySelector('.modal-cancel-btn');
                        if (cancelBtn) cancelBtn.click();
                    }
                }
            });
        }

        // Focus on confirm button
        setTimeout(() => {
            const confirmBtn = document.querySelector(#${id}-overlay .modal-confirm-btn);
            if (confirmBtn) confirmBtn.focus();
        }, 100);
    });
}

export default {
    createConfirmationDialog,
    showConfirmationDialog,
};