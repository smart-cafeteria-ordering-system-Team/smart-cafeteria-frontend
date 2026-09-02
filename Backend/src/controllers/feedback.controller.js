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
    const { orderId, rating, comment, category, dishName } = req.body;

    // ✅ Validate required fields
    if (!rating) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: "Rating is required",
      });
    }

    // ✅ If orderId is provided, validate the order exists
    if (orderId) {
      const order = await Order.findOne({ orderId: orderId });
      if (!order) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: "Order not found",
        });
      }
    }

    // ✅ Check if feedback already (only when orderId is provided)
    if (orderId) {
      const existingFeedback = await Feedback.findOne({
        orderId: orderId,
        userId: req.user.id,
      });
      if (existingFeedback) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          error: "Feedback already submitted for this order",
        });
      }
    }

    // ✅ Validate rating
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,

        error: "Rating must be between 1 and 5",
      });
    }

    // ✅ Check if order exists
    const order = await Order.findOne({ orderId: orderId });
    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: "Order not found",
      });
    }

    // ✅ Check if feedback already

    exists;
    const existingFeedback = await Feedback.findOne({
      orderId: order._id,
      userId: req.user.id,
    });
    if (existingFeedback) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        error: "Feedback already submitted for this order",
      });
    }

    // ✅ Create feedback
    const feedback = await Feedback.create({
      userId: req.user.id,
      orderId: order._id,
      rating: rating,
      comment: comment || "",
      category: category || "Food Quality",
      dishName: dishName || "",
      status: FEEDBACK_STATUS.PENDING,
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Thank you for your feedback!",

      feedback: {
        id: feedback._id,
        rating: feedback.rating,
        comment: feedback.comment,
        category: feedback.category,
        dishName: feedback.dishName,
        status: feedback.status,
        createdAt: feedback.createdAt,
      },
    });
  } catch (error) {
    console.error("❌ Submit Feedback Error:", error);

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: MESSAGES.SERVER_ERROR,
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
    const pending = await Feedback.countDocuments({
      status: FEEDBACK_STATUS.PENDING,
    });
    const approved = await Feedback.countDocuments({
      status: FEEDBACK_STATUS.APPROVED,
    });
    const rejected = await Feedback.countDocuments({
      status: FEEDBACK_STATUS.REJECTED,
    });

    // ✅ Calculate average rating
    const allFeedback = await Feedback.find();
    const ratings = allFeedback.map((fb) => fb.rating);
    const averageRating =
      ratings.length > 0
        ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1)
        : 0;

    // ✅ Rating distribution
    const ratingDistribution = {
      1: allFeedback.filter((fb) => fb.rating === 1).length,
      2: allFeedback.filter((fb) => fb.rating === 2).length,
      3: allFeedback.filter((fb) => fb.rating === 3).length,

      4: allFeedback.filter((fb) => fb.rating === 4).length,
      5: allFeedback.filter((fb) => fb.rating === 5).length,
    };

    res.status(HTTP_STATUS.OK).json({
      success: true,
      stats: {
        totalFeedback,
        pending,
        approved,
        rejected,
        averageRating: parseFloat(averageRating),
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
