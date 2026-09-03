const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

const ROLES = {
  CUSTOMER: 'customer',
  KITCHEN: 'kitchen',
  ADMIN: 'admin',
};

const ORDER_STATUS = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  READY: 'ready',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  RECEIVED: 'Received',
  SERVED: 'served',
};

const PAYMENT_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  SIMULATED: 'simulated',
  PAID: 'paid',
  CANCELLED: 'cancelled',
};

const PAYMENT_METHODS = {
  TELEBIRR: 'telebirr',
  CBE_BIRR: 'cbe_birr',
  CASH: 'cash',
  CHAPA: 'chapa',
};

const FEEDBACK_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

const MENU_CATEGORIES = [
  'breakfast',
  'mains',
  'main-meals',
  'fasting',
  'beverages',
  'snacks',
  'Lunch',
  'Dinner',
  'Drinks',
];

const MESSAGES = {
  SERVER_ERROR: 'Something went wrong. Please try again later.',
  ORDER_PLACED: 'Order placed successfully.',
  ORDER_CANCELLED: 'Order cancelled successfully.',
  AUTH_FAILED: 'Authentication failed.',
  INVALID_TOKEN: 'Invalid or expired token.',
  ITEM_NOT_FOUND: 'Item not found.',
  USER_NOT_FOUND: 'User not found.',
  ACCESS_DENIED: 'Access denied.',
};

module.exports = {
  HTTP_STATUS,
  ROLES,
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  FEEDBACK_STATUS,
  MENU_CATEGORIES,
  MESSAGES,
};
