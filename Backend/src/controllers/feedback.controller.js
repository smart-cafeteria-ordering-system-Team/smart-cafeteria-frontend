const Feedback = require("../models/Feedback");
const Order = require("../models/Order");
const User = require("../models/User");
const Notification = require("../models/Notification");
const {
  FEEDBACK_STATUS,
  MESSAGES,
  HTTP_STATUS,
} = require("../config/constants");

/**

* @desc    Submit feedback for an order
* @route   POST /api/feedback
* @access  Private
*
* Frontend: feedback.html → Submit feedback
* Expected Body: { orderId, rating, comment, category }
* Response: { success, feedback }
*/
exports.submitFeedback = async (req, res) => {
  try {
    const { rating, topic, category, dishName, comment, orderId } = req.body;

    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User authentication failed.' });
    }

    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5.' });
    }

    const feedbackPayload = {
      userId,
      rating: Number(rating),
      topic: topic || category || 'General',
      category: category || topic || 'General',
      dishName: dishName || '',
      comment: comment || ''
    };

    if (orderId && typeof orderId === 'string' && orderId.match(/^[0-9a-fA-F]{24}$/)) {
      feedbackPayload.orderId = orderId;
    }

    const newFeedback = await Feedback.create(feedbackPayload);

    return res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: newFeedback
    });
  } catch (error) {
    console.error('Feedback Submission Server Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while submitting feedback'
    });
  }
};

/**
* @desc    Get user's feedback
* @route   GET /api/feedback/my
* @access  Private
*
* Frontend: feedback.html → Show user's past feedback
* Response: { success, count,

feedback: [...] }
*/
exports.getMyFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({ userId: req.user.id })
      .populate("orderId", "orderId customerName items totalAmount")
      .sort({ createdAt: -1 });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: feedback.length,
      feedback: feedback.map((fb) => ({
        id: fb._id,

        orderId: fb.orderId?.orderId || "N/A",
        rating: fb.rating,
        comment: fb.comment,
        category: fb.category,
        dishName: fb.dishName,
        status: fb.status,
        reply: fb.reply,
        createdAt: fb.createdAt,
      })),
    });
  } catch (error) {
    console.error("❌ Get My Feedback Error:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: MESSAGES.SERVER_ERROR,
    });
  }
};

/**
* @desc    Get all feedback (Admin only)
* @route   GET /api/feedback
* @access  Private/Admin
*
* Frontend: admin/feedback.html → Load all feedback
* Query Params: status, rating, date
* Response: { success, count, feedback: [...] }

*/
exports.getAllFeedback = async (req, res) => {
  try {
    const { status, rating, date, limit = 50, page = 1 } = req.query;

    // ✅ Build filter
    let filter = {};
    if (status && status !== "all") filter.status = status;
    if (rating) filter.rating = parseInt(rating);
    if (date) filter.createdAt = { $regex: date };

    // ✅ Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // ✅ Execute query
    const feedback = await Feedback.find(filter)
      .populate("userId", "name email phone")
      .populate("orderId", "orderId customerName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Feedback.countDocuments(filter);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: feedback.length,
      total: total,
      feedback: feedback.map((fb) => ({
        id: fb._id,
        user: fb.userId
          ? {
              name: fb.userId.name,
              email: fb.userId.email,
              phone: fb.userId.phone,
            }
          : null,
        orderId: fb.orderId?.orderId || "N/A",
        customerName: fb.orderId?.customerName || "N/A",
        rating: fb.rating,
        comment: fb.comment,
        category: fb.category,

        dishName: fb.dishName,
        status: fb.status,
        reply: fb.reply,
        createdAt: fb.createdAt,
      })),
    });
  } catch (error) {
    console.error("❌ Get All Feedback Error:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: MESSAGES.SERVER_ERROR,
    });
  }
};

/**
 * @desc    Reply to feedback (Admin only)
 * @route   PATCH /api/feedback/:id/reply
 * @access  Private/Admin
 *
 * Frontend: admin/feedback.html → Reply to feedback
 * Expected Body: { reply }
 * Response: { success, feedback }
 */
exports.replyToFeedback = async (req, res) => {
  try {
    const { reply } = req.body;

    if (!reply || reply.trim() === "") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: "Reply message is required",
      });
    }

    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,

        error: "Feedback not found",
      });
    }

    // ✅ Update feedback
    feedback.reply = reply.trim();
    feedback.status = FEEDBACK_STATUS.APPROVED;
    feedback.repliedAt = new Date();
    feedback.repliedBy = req.user.id;

    await feedback.save();

    // ✅ Create notification for user
    await Notification.create({
      userId: feedback.userId,
      title: "Reply to your feedback",

      message: `Admin replied to your feedback: "${reply.trim()}"`,
      type: "system",
      isRead: false,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Reply sent successfully",
      feedback: {
        id: feedback._id,
        reply: feedback.reply,
        status: feedback.status,
        repliedAt: feedback.repliedAt,
      },
    });
  } catch (error) {
    console.error("❌ Reply To Feedback Error:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: MESSAGES.SERVER_ERROR,
    });
  }
};

/**
* @desc    Delete feedback (Admin only)

* @route   DELETE /api/feedback/:id
* @access  Private/Admin
*
* Frontend: admin/feedback.html → Delete feedback
* Response: { success, message }
*/
exports.deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);

    if (!feedback) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: "Feedback not found",
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Feedback deleted successfully",
    });
  } catch (error) {
    console.error("❌ Delete Feedback Error:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: MESSAGES.SERVER_ERROR,
    });
  }
};

/**
* @desc    Get feedback statistics (Admin only)
* @route   GET /api/feedback/stats
* @access  Private/Admin
*
* Frontend: admin/feedback.html → Metrics
* Response: { totalFeedback, pending, approved, averageRating, ratingDistribution }

*/
exports.getFeedbackStats = async (req, res) => {
  try {
    const totalFeedback = await Feedback.countDocuments();

    // ✅ Calculate average rating across all feedback via aggregation
    const avgRatingResult = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" }
        }
      }
    ]);
    const averageRating =
      avgRatingResult.length > 0 ? Number(avgRatingResult[0].avgRating).toFixed(1) : "0.0";

    // ✅ Positive Reviews count (rating >= 4)
    const positiveReviews = await Feedback.countDocuments({
      rating: { $gte: 4 }
    });

    // ✅ Pending Issues count (case-insensitive status match)
    const pendingIssues = await Feedback.countDocuments({
      status: { $regex: /^pending$/i }
    });

    const approved = await Feedback.countDocuments({
      status: FEEDBACK_STATUS.APPROVED
    });
    const rejected = await Feedback.countDocuments({
      status: FEEDBACK_STATUS.REJECTED
    });

    // ✅ Rating distribution
    const ratingAggregation = await Feedback.aggregate([
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      }
    ]);
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingAggregation.forEach((r) => {
      if (r._id >= 1 && r._id <= 5) ratingDistribution[r._id] = r.count;
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      stats: {
        totalFeedback,
        averageRating: parseFloat(averageRating),
        averageRatingText: averageRating,
        positiveReviews,
        pendingIssues,
        pending: pendingIssues,
        approved,
        rejected,
        ratingDistribution,
      },
    });
  } catch (error) {
    console.error("❌ Get Feedback Stats Error:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: MESSAGES.SERVER_ERROR,
    });
  }
};
