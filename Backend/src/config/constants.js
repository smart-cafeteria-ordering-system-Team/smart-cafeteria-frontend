const PAYMENT_STATUS = {
	PENDING: 'PENDING',
	PAID: 'PAID',
	FAILED: 'FAILED',
	CANCELLED: 'CANCELLED'
};

const ORDER_STATUS = {
	PENDING: 'pending',
	PREPARING: 'preparing',
	READY: 'ready',
	SERVED: 'served',
	COMPLETED: 'completed',
	CANCELLED: 'cancelled'
};

const PAYMENT_METHODS = { TELEBIRR: 'TELEBIRR', CHAPA: 'CHAPA' };
const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500
};
const MESSAGES = { ORDER_PLACED: 'Order placed successfully', SERVER_ERROR: 'Server error' };

const FEEDBACK_STATUS = {
    PENDING: 'PENDING',
    APPROVED: 'RESOLVED',
    REJECTED: 'ARCHIVED'
};

const CANCELLATION_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
};

module.exports = {
    PAYMENT_STATUS,
    ORDER_STATUS,
    PAYMENT_METHODS,
    HTTP_STATUS,
    MESSAGES,
    FEEDBACK_STATUS,
    CANCELLATION_STATUS
};
