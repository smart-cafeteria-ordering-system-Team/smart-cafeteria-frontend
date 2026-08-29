/**
 * Smart Cafeteria Ordering System
 * File: frontend/src/js/order-cancellation.js
 */

import orderCancellationService from "../services/order-cancellation.service.js";

document.addEventListener("DOMContentLoaded", () => {
  initializeCancellation();
});

function initializeCancellation() {
  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-cancel-order]");

    if (!button) return;
    if (button.dataset.processing === "true" || button.disabled) return;

    const orderId = button.dataset.cancelOrder;
    if (!orderId) return;

    const confirmed = confirm("Are you sure you want to cancel this order?");
    if (!confirmed) return;

    try {
      button.dataset.processing = "true";
      button.disabled = true;
      const originalText = button.textContent;
      button.textContent = "Cancelling...";

      await orderCancellationService.cancelOrder(
        orderId,
        "Cancelled by customer",
      );
      alert("Order cancelled successfully.");
      window.location.reload();
    } catch (error) {
      alert(error.message);
      button.dataset.processing = "false";
      button.disabled = false;
      button.textContent = originalText || "Cancel Order";
    }
  });
}
