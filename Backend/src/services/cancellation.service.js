import { updateOrderStatus } from './order.service.js';
import { ORDER_STATUS } from '../utils/constants.js';

const cancellations = [];

export const requestCancellation = async (orderId, reason, currentOrderStatus) => {
    // Prevent cancelling orders already prepared or completed
    if (currentOrderStatus === ORDER_STATUS.READY || currentOrderStatus === ORDER_STATUS.COMPLETED) {
        throw { status: 400, message: 'Cannot cancel order once it is ready or completed' };
    }

    const cancellationRecord = {
        id: `cncl_${Date.now()}`,
        orderId,
        reason,
        status: 'APPROVED',
        requestedAt: new Date()
    };

    cancellations.push(cancellationRecord);
    
    // Update main order status
    await updateOrderStatus(orderId, ORDER_STATUS.CANCELLED);

    return cancellationRecord;
};