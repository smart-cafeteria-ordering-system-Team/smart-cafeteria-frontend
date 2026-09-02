/**
 * ================================================================
 * SMART CAFETERIA ORDERING SYSTEM - FEEDBACK MODULE
 * ================================================================
 * Handles customer feedback, ratings, and reviews.
 * ================================================================
 */

import { getCurrentUser } from './auth.js';
import { getOrderById } from './order-status.js';
import { showToast } from './main.js';

// ===== 1. FEEDBACK STATE =====
let feedbackList = [];
let feedbackListeners = [];

// ===== 2. MOCK FEEDBACK DATA =====
const MOCK_FEEDBACK = [
    {
        id: 'f1',
        userId: 'u3',
        orderId: 'o1',
        rating: 5,
        comment: 'Excellent food and service! The pasta was delicious.',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        status: 'approved',
        reply: null,
    },
    {
        id: 'f2',
        userId: 'u4',
        orderId: 'o2',
        rating: 4,
        comment: 'Good food, but a bit slow on preparation.',
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        status: 'pending',
        reply: null,
    },
];

// ===== 3. FEEDBACK FUNCTIONS =====

/**
 * Initialize feedback with mock data if empty
 */
function initFeedback() {

/**
 * Initialize user profile header - replace "Loading..." with stored name immediately
 */
function initUserProfileHeader() {
  const userStr = localStorage.getItem("user");
  const token = localStorage.getItem("token");
  const nameElements = document.querySelectorAll("#userNameDisplay, #userProfileName, .user-profile-name");

  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      const name = user.fullName || user.name || user.email || "User";
      nameElements.forEach(el => { el.textContent = name; });
      return;
    } catch (err) {
      console.error("Error parsing stored user:", err);
    }
  }

  // Fallback fetch if token exists
  if (token) {
    fetch("http://localhost:5000/api/v1/auth/me", {
      headers: { "Authorization": "Bearer " + token }
    })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        const name = data.user.fullName || data.user.name || "User";
        nameElements.forEach(el => { el.textContent = name; });
      }
    })
    .catch(err => {
      console.error("Auth check failed:", err);
      nameElements.forEach(el => { el.textContent = "Account"; });
    })
  } else {
    nameElements.forEach(el => { el.textContent = "Account"; });
  }
}

    if (feedbackList.length === 0) {
        feedbackList = [...MOCK_FEEDBACK];
    }
}
initFeedback();

/**
 * Initialize star rating UI on feedback form with click/hover support
 */
let selectedRatingValue = 0;

function setupStarRating() {
  // Target all star icons inside the rating container
  const starContainer = document.querySelector(".rating-stars, .star-rating, #starRating") || document.querySelector(".mb-3 .d-flex");
  if (!starContainer) return;

  const stars = starContainer.querySelectorAll("i, svg, span");
  if (stars.length === 0) return;

  stars.forEach((star, index) => {
    star.style.cursor = "pointer";
    star.style.fontSize = "1.8rem";
    star.style.marginRight = "5px";

    // Mouseover visual highlighting
    star.addEventListener("mouseover", () => {
      stars.forEach((s, i) => {
        s.style.color = i <= index ? "#ffc107" : "#e4e5e9";
      });
    });

    // Mouseout reset to selected state
    starContainer.addEventListener("mouseleave", () => {
      stars.forEach((s, i) => {
        s.style.color = i < selectedRatingValue ? "#ffc107" : "#e4e5e9";
      });
    });

    // Click event to register rating value
    star.addEventListener("click", () => {
      selectedRatingValue = index + 1;
      const label = document.querySelector(".rating-label, #ratingText");
      if (label) {
        const labels = ["Poor", "Fair", "Good", "Very Good", "Excellent"];
        label.textContent = labels[index] || `${selectedRatingValue} Stars`;
      }
      stars.forEach((s, i) => {
        s.style.color = i < selectedRatingValue ? "#ffc107" : "#e4e5e9";
      });
    });
  });
}

document.addEventListener("DOMContentLoaded", function () {
	 initUserProfileHeader();
	 setupStarRating();
});

/**
 * Get all feedback (Admin only)
 * @param {Object} filters - Filter options
 * @param {number} filters.rating - Rating filter
 * @param {string} filters.status - Status filter
 * @param {string} filters.date - Date filter
 * @returns {Array} Feedback list
 */
export function getAllFeedback(filters = {}) {
    let result = [...feedbackList];

    if (filters.rating) {
        result = result.filter(f => f.rating === filters.rating);
    }

    if (filters.status) {
        result = result.filter(f => f.status === filters.status);
    }

    if (filters.date) {
        const dateStr = filters.date;
        result = result.filter(f => f.createdAt.startsWith(dateStr));
    }

    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return result;
}

/**
 * Get user's feedback
 * @param {string} userId - User ID
 * @returns {Array} User feedback
 */
export function getUserFeedback(userId) {
    return feedbackList.filter(f => f.userId === userId);
}

/**
 * Get current user's feedback
 * @returns {Array} Current user's feedback
 */
export function getMyFeedback() {
    const user = getCurrentUser();
    if (!user) return [];
    return getUserFeedback(user.id);
}

/**
 * Get feedback by order ID
 * @param {string} orderId - Order ID
 * @returns {Object|null} Feedback or null
 */
export function getFeedbackByOrder(orderId) {
    return feedbackList.find(f => f.orderId === orderId) || null;
}

/**
 * Submit feedback for an order
 * @param {number} rating - Rating (1-5)
 * @param {string} comment - Feedback comment
 * @returns {Promise<Object>} Submitted feedback or error
 */
export async function submitFeedback(rating, comment = '') {
	try {
		const user = getCurrentUser();
		if (!user) {
			return { success: false, error: 'Please login to submit feedback' };
		}

		// Get orderId from URL search params, then localStorage
		const urlParams = new URLSearchParams(window.location.search);
		let orderId = urlParams.get('orderId');
		if (!orderId) {
			orderId = localStorage.getItem('lastOrderId');
		}

		// If orderId is available, validate the order
		if (orderId) {
			const order = getOrderById(orderId);
			if (!order) {
				return { success: false, error: 'Order not found' };
			}

			// Check if feedback already exists
			const existing = getFeedbackByOrder(orderId);
			if (existing) {
				return { success: false, error: 'Feedback already submitted for this order' };
			}
		}

		// Validate rating
		if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
			return { success: false, error: 'Rating must be between 1 and 5' };
		}

		const feedback = {
			id: 'f' + Date.now(),
			userId: user.id,
			...(orderId && { orderId }),
			rating: rating,
			comment: comment.trim() || '',
			createdAt: new Date().toISOString(),
			status: 'pending',
			reply: null,
		};

		feedbackList.push(feedback);
		notifyFeedbackListeners();

		showToast('Thank you for your feedback!', 'success');

		return { success: true, feedback };

	} catch (error) {
		console.error('Submit feedback error:', error);
		return { success: false, error: 'Failed to submit feedback' };
	}
}

/**
 * Reply to feedback (Admin only)
 * @param {string} feedbackId - Feedback ID
 * @param {string} reply - Reply message
 * @returns {Promise<Object>} Updated feedback or error
 */
export async function replyToFeedback(feedbackId, reply) {
    try {
        const index = feedbackList.findIndex(f => f.id === feedbackId);

        if (index === -1) {
            return { success: false, error: 'Feedback not found' };
        }

        if (!reply || reply.trim() === '') {
            return { success: false, error: 'Reply message is required' };
        }

        feedbackList[index].reply = reply.trim();
        feedbackList[index].status = 'approved';

        notifyFeedbackListeners();
        showToast('Reply sent successfully', 'success');

        return { success: true, feedback: feedbackList[index] };

    } catch (error) {
        console.error('Reply to feedback error:', error);
        return { success: false, error: 'Failed to send reply' };
    }
}

/**
 * Delete feedback (Admin only)
 * @param {string} feedbackId - Feedback ID
 * @returns {Promise<Object>} Success or error
 */
export async function deleteFeedback(feedbackId) {
    try {
        const index = feedbackList.findIndex(f => f.id === feedbackId);

        if (index === -1) {
            return { success: false, error: 'Feedback not found' };
        }

        feedbackList.splice(index, 1);
        notifyFeedbackListeners();

        showToast('Feedback deleted', 'info');

        return { success: true };

    } catch (error) {
        console.error('Delete feedback error:', error);
        return { success: false, error: 'Failed to delete feedback' };
    }
}

/**
 * Get feedback statistics
 * @returns {Object} Feedback statistics
 */
export function getFeedbackStats() {
    const total = feedbackList.length;
    const pending = feedbackList.filter(f => f.status === 'pending').length;
    const approved = feedbackList.filter(f => f.status === 'approved').length;

    const ratings = feedbackList.map(f => f.rating);
    const averageRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
        : 0;

    const ratingDistribution = {
        1: feedbackList.filter(f => f.rating === 1).length,
        2: feedbackList.filter(f => f.rating === 2).length,
        3: feedbackList.filter(f => f.rating === 3).length,
        4: feedbackList.filter(f => f.rating === 4).length,
        5: feedbackList.filter(f => f.rating === 5).length,
    };

    return {
        total,
        pending,
        approved,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution,
    };
}

// ===== 4. FEEDBACK LISTENERS =====

/**
 * Add feedback change listener
 * @param {Function} listener - Callback function
 */
export function addFeedbackListener(listener) {
    if (typeof listener === 'function') {
        feedbackListeners.push(listener);
    }
}

/**
 * Remove feedback change listener
 * @param {Function} listener - Callback function
 */
export function removeFeedbackListener(listener) {
    feedbackListeners = feedbackListeners.filter(l => l !== listener);
}

/**
 * Notify all feedback listeners
 */
function notifyFeedbackListeners() {
    feedbackListeners.forEach(listener => {
        try {
            listener(feedbackList);
        } catch (error) {
            console.error('Feedback listener error:', error);
        }
    });
}

/**
 * Submit feedback form from customer page
 */
async function handleFeedbackFormSubmit(e) {
	 e.preventDefault();

	 var ratingInput = document.getElementById("ratingValue");
	 var rating = ratingInput ? parseInt(ratingInput.value, 10) : selectedRatingValue;

	 var comment = document.getElementById("feedback-comments")?.value.trim() || "";
	 var category = document.getElementById("feedback-category")?.value || "Food Quality";
	 var dishName = document.getElementById("dish-reviewed")?.value.trim() || "";

	 // Get orderId from URL search params, then localStorage
	 var urlParams = new URLSearchParams(window.location.search);
	 var orderId = urlParams.get("orderId") || localStorage.getItem("lastOrderId");

	 var feedbackPayload = {
	   rating: rating,
	   topic: category,
	   dishName: dishName,
	   comment: comment
	 };

	 // Attach orderId ONLY if present in URL search params
	 if (orderId) {
	   feedbackPayload.orderId = orderId;
 };


	 var token = localStorage.getItem("token");
	 if (!token) {
	   alert("Please login to submit feedback");
	   return;
 };


	 try {
	   var res = await fetch("http://localhost:5000/api/v1/feedback", {
		 method: "POST",
		 headers: {
		   "Content-Type": "application/json",
		   "Authorization": `Bearer ${token}`
		 },
		 body: JSON.stringify(feedbackPayload)
	   });
	   var data = await res.json();
	   if (!res.ok) {
		 throw new Error(data.error || "Failed to submit feedback");
	   }
	   alert("Feedback submitted successfully!");
	   window.location.reload();
	 } catch (err) {
	   console.error("Feedback submit error:", err);
	   alert("Error: " + (err.message || "Failed to send feedback"));
	 }
}
// ===== 5. EXPORTS =====
export default {
    getAllFeedback,
    getUserFeedback,
    getMyFeedback,
    getFeedbackByOrder,
    submitFeedback,
    replyToFeedback,
    deleteFeedback,
    getFeedbackStats,
    addFeedbackListener,
    removeFeedbackListener,
};