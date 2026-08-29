// utils/constants.js

const ROLES = {
    CUSTOMER: 'customer',
    KITCHEN: 'kitchen',
    ADMIN: 'admin'
};

const ORDER_STATUS = {
    PENDING: 'pending',
    PREPARING: 'preparing',
    READY: 'ready',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
};

const PAYMENT_METHODS = {
    TELEBIRR: 'telebirr',
    CBE_BIRR: 'cbe_birr',
    CASH: 'cash'
};

const PAYMENT_STATUS = {
    PENDING: 'pending',
    SUCCESS: 'success',
    FAILED: 'failed'
};
module.exports = { ROLES, ORDER_STATUS, PAYMENT_METHODS, PAYMENT_STATUS };
