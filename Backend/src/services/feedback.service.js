const feedbackList = [];

export const submitFeedback = async (userId, orderId, rating, comment) => {
    if (!rating || rating < 1 || rating > 5) {
        throw { status: 400, message: 'Rating must be between 1 and 5' };
    }

    const feedback = {
        id: `fb_${Date.now()}`,
        userId,
        orderId,
        rating,
        comment: comment || '',
        createdAt: new Date()
    };

    feedbackList.push(feedback);
    return feedback;
};

export const getOrderFeedback = async (orderId) => {
    return feedbackList.find(f => f.orderId === orderId) || null;
};