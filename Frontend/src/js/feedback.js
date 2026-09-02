/**
 * ================================================================
 * SMART CAFETERIA ORDERING SYSTEM - FEEDBACK MODULE
 * ================================================================
 * Handles customer feedback, ratings, and reviews.
 * ================================================================
 */

import { getCurrentUser } from './auth.js';
import { showToast } from './main.js';

// ===== 1. FEEDBACK STATE =====
let feedbackList = [];
let feedbackListeners = [];
let selectedRatingValue = 0;

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
    if (feedbackList.length === 0) {
        feedbackList = [...MOCK_FEEDBACK];
    }
}

// --- CLIENT-SIDE PROFILE STATE HYDRATION PIPELINE ---
function initUserProfileHeader() {
    var nameElements = document.querySelectorAll('#userNameDisplay, #userProfileName, .user-profile-name, [data-user-name]');
    if (nameElements.length === 0) return;

    var userStr = localStorage.getItem('user');
    var token = localStorage.getItem('token');

    // Phase A: Synchronous cache read
    if (userStr) {
        try {
            var user = JSON.parse(userStr);
            var name = user.fullName || user.name || user.username || user.email || 'Customer';
            nameElements.forEach(function (el) {
                if (el.childNodes.length > 0) {
                    el.childNodes[0].nodeValue = name;
                } else {
                    el.textContent = name;
                }
            });
            return;
        } catch (err) {
            console.error('Error parsing local user data:', err);
        }
    }

    // Phase B: Asynchronous fallback verification
    if (token) {
        fetch('http://localhost:5000/api/v1/auth/me', {
            headers: { 'Authorization': 'Bearer ' + token }
        })
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (data.success && data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
                var asyncName = data.user.fullName || data.user.name || 'Customer';
                nameElements.forEach(function (el) {
                    if (el.childNodes.length > 0) {
                        el.childNodes[0].nodeValue = asyncName;
                    } else {
                        el.textContent = asyncName;
                    }
                });
            }
        })
        .catch(function () {
            // Phase C: Safe fallback to default string
            nameElements.forEach(function (el) {
                if (el.childNodes.length > 0) {
                    el.childNodes[0].nodeValue = 'Account';
                } else {
                    el.textContent = 'Account';
                }
            });
        });
    } else {
        // No token — display default
        nameElements.forEach(function (el) {
            if (el.childNodes.length > 0) {
                el.childNodes[0].nodeValue = 'Account';
            } else {
                el.textContent = 'Account';
            }
        });
    }
}

// --- STATE-DRIVEN STAR RATING INTERACTOR ENGINE ---
function setupStarRating() {
    var starContainer = document.querySelector('.star-rating, .rating-stars, #star-rating-group, #starRating');
    if (!starContainer) return;

    var stars = starContainer.querySelectorAll('.star-btn, i, svg, span');
    if (stars.length === 0) return;

    stars.forEach(function (star, index) {
        star.style.cursor = 'pointer';
        star.style.fontSize = '1.8rem';
        star.style.marginRight = '5px';
        star.style.transition = 'color 0.2s ease-in-out';

        // Hover highlighting
        star.addEventListener('mouseover', function () {
            stars.forEach(function (s, i) {
                s.style.color = i <= index ? '#ffc107' : '#e4e5e9';
            });
        });

        // Mouse leave resets to selected state
        starContainer.addEventListener('mouseleave', function () {
            stars.forEach(function (s, i) {
                s.style.color = i < selectedRatingValue ? '#ffc107' : '#e4e5e9';
            });
        });

        // Click selection
        star.addEventListener('click', function () {
            selectedRatingValue = index + 1;

            var ratingInput = document.getElementById('ratingValue');
            if (ratingInput) ratingInput.value = selectedRatingValue;

            var label = document.querySelector('.rating-label, #ratingText, #rating-text, .rating-label-text');
            if (label) {
                var ratingNames = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
                label.textContent = selectedRatingValue + ' / 5 - ' + ratingNames[index];
            }

            stars.forEach(function (s, i) {
                s.style.color = i < selectedRatingValue ? '#ffc107' : '#e4e5e9';
            });
        });
    });
}

// --- DECOUPLED FEEDBACK SUBMISSION ENGINE ---
function handleFeedbackFormSubmit(e) {
    e.preventDefault();

    var ratingInput = document.getElementById('ratingValue');
    var rating = ratingInput ? parseInt(ratingInput.value, 10) : selectedRatingValue;

    var comment = document.getElementById('feedback-comments') ? document.getElementById('feedback-comments').value.trim() : '';
    var category = document.getElementById('feedback-category') ? document.getElementById('feedback-category').value : 'Food Quality';
    var dishName = document.getElementById('dish-reviewed') ? document.getElementById('dish-reviewed').value.trim() : '';

    if (!rating || rating < 1 || rating > 5) {
        alert('Please select a star rating between 1 and 5.');
        return;
    }
    if (!comment) {
        alert('Please enter your comments / review.');
        return;
    }

    var token = localStorage.getItem('token');
    if (!token) {
        alert('Please login to submit feedback.');
        return;
    }

    // Extrapolate orderId from URL query params, fallback to localStorage
    var urlParams = new URLSearchParams(window.location.search);
    var orderId = urlParams.get('orderId') || localStorage.getItem('lastOrderId') || null;

    // Construct dynamic payload independent of order context
    var feedbackPayload = {
        rating: Number(rating),
        comment: comment,
        category: category,
        dishName: dishName
    };

    // Attach orderId ONLY if present
    if (orderId) {
        feedbackPayload.orderId = orderId;
    }

    var submitBtn = document.querySelector('#feedback-form .btn-primary, #feedbackForm .btn-primary');
    if (submitBtn) submitBtn.disabled = true;

    fetch('http://localhost:5000/api/v1/feedback', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(feedbackPayload)
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
        if (!res.ok && !data.success) {
            throw new Error(data.error || 'Failed to submit feedback.');
        }
        alert(data.message || 'Thank you for your feedback!');
        window.location.reload();
    })
    .catch(function (err) {
        console.error('Feedback submit error:', err);
        alert('Error: ' + (err.message || 'Failed to send feedback'));
    })
    .finally(function () {
        if (submitBtn) submitBtn.disabled = false;
    });
}

// ===== 4. FEEDBACK LISTENERS =====

function addFeedbackListener(listener) {
    if (typeof listener === 'function') {
        feedbackListeners.push(listener);
    }
}

function removeFeedbackListener(listener) {
    feedbackListeners = feedbackListeners.filter(function (l) { return l !== listener; });
}

function notifyFeedbackListeners() {
    feedbackListeners.forEach(function (listener) {
        try {
            listener(feedbackList);
        } catch (error) {
            console.error('Feedback listener error:', error);
        }
    });
}

// ===== 5. EXPORTS =====

export function getAllFeedback(filters) {
    filters = filters || {};
    var result = feedbackList.slice();

    if (filters.rating) {
        result = result.filter(function (f) { return f.rating === filters.rating; });
    }
    if (filters.status) {
        result = result.filter(function (f) { return f.status === filters.status; });
    }
    if (filters.date) {
        var dateStr = filters.date;
        result = result.filter(function (f) { return f.createdAt.startsWith(dateStr); });
    }

    result.sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
    return result;
}

export function getUserFeedback(userId) {
    return feedbackList.filter(function (f) { return f.userId === userId; });
}

export function getMyFeedback() {
    var user = getCurrentUser();
    if (!user) return [];
    return getUserFeedback(user.id);
}

export function getFeedbackByOrder(orderId) {
    return feedbackList.find(function (f) { return f.orderId === orderId; }) || null;
}

export async function submitFeedback(rating, comment) {
    comment = comment || '';
    try {
        var user = getCurrentUser();
        if (!user) {
            return { success: false, error: 'Please login to submit feedback' };
        }

        var urlParams = new URLSearchParams(window.location.search);
        var orderId = urlParams.get('orderId') || localStorage.getItem('lastOrderId');

        if (orderId) {
            var existing = getFeedbackByOrder(orderId);
            if (existing) {
                return { success: false, error: 'Feedback already submitted for this order' };
            }
        }

        if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
            return { success: false, error: 'Rating must be between 1 and 5' };
        }

        var feedback = {
            id: 'f' + Date.now(),
            userId: user.id,
            rating: rating,
            comment: comment.trim() || '',
            createdAt: new Date().toISOString(),
            status: 'pending',
            reply: null,
        };

        if (orderId) {
            feedback.orderId = orderId;
        }

        feedbackList.push(feedback);
        notifyFeedbackListeners();
        showToast('Thank you for your feedback!', 'success');

        return { success: true, feedback: feedback };
    } catch (error) {
        console.error('Submit feedback error:', error);
        return { success: false, error: 'Failed to submit feedback' };
    }
}

export async function replyToFeedback(feedbackId, reply) {
    try {
        var index = feedbackList.findIndex(function (f) { return f.id === feedbackId; });
        if (index === -1) return { success: false, error: 'Feedback not found' };
        if (!reply || reply.trim() === '') return { success: false, error: 'Reply message is required' };

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

export async function deleteFeedback(feedbackId) {
    try {
        var index = feedbackList.findIndex(function (f) { return f.id === feedbackId; });
        if (index === -1) return { success: false, error: 'Feedback not found' };

        feedbackList.splice(index, 1);
        notifyFeedbackListeners();
        showToast('Feedback deleted', 'info');

        return { success: true };
    } catch (error) {
        console.error('Delete feedback error:', error);
        return { success: false, error: 'Failed to delete feedback' };
    }
}

export function getFeedbackStats() {
    var total = feedbackList.length;
    var pending = feedbackList.filter(function (f) { return f.status === 'pending'; }).length;
    var approved = feedbackList.filter(function (f) { return f.status === 'approved'; }).length;

    var ratings = feedbackList.map(function (f) { return f.rating; });
    var averageRating = ratings.length > 0
        ? ratings.reduce(function (sum, r) { return sum + r; }, 0) / ratings.length
        : 0;

    var ratingDistribution = {
        1: feedbackList.filter(function (f) { return f.rating === 1; }).length,
        2: feedbackList.filter(function (f) { return f.rating === 2; }).length,
        3: feedbackList.filter(function (f) { return f.rating === 3; }).length,
        4: feedbackList.filter(function (f) { return f.rating === 4; }).length,
        5: feedbackList.filter(function (f) { return f.rating === 5; }).length,
    };

    return {
        total: total,
        pending: pending,
        approved: approved,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution: ratingDistribution,
    };
}

// ===== 6. INITIALIZATION =====
initFeedback();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        initUserProfileHeader();
        setupStarRating();
        var form = document.querySelector('#feedback-form, #feedbackForm, form');
        if (form) form.addEventListener('submit', handleFeedbackFormSubmit);
    });
} else {
    initUserProfileHeader();
    setupStarRating();
    var form = document.querySelector('#feedback-form, #feedbackForm, form');
    if (form) form.addEventListener('submit', handleFeedbackFormSubmit);
}

export default {
    getAllFeedback: getAllFeedback,
    getUserFeedback: getUserFeedback,
    getMyFeedback: getMyFeedback,
    getFeedbackByOrder: getFeedbackByOrder,
    submitFeedback: submitFeedback,
    replyToFeedback: replyToFeedback,
    deleteFeedback: deleteFeedback,
    getFeedbackStats: getFeedbackStats,
    addFeedbackListener: addFeedbackListener,
    removeFeedbackListener: removeFeedbackListener,
};
