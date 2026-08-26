import { ORDER_STATUS } from '../utils/constants.js';

export const generateSalesReport = async (ordersList) => {
    const completedOrders = ordersList.filter(o => o.status === ORDER_STATUS.COMPLETED);
    
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalPrice, 0);
    const totalOrdersCount = ordersList.length;
    const cancelledOrdersCount = ordersList.filter(o => o.status === ORDER_STATUS.CANCELLED).length;

    return {
        generatedAt: new Date(),
        metrics: {
            totalOrders: totalOrdersCount,
            completedOrders: completedOrders.length,
            cancelledOrders: cancelledOrdersCount,
            totalRevenue: Number(totalRevenue.toFixed(2))
        }
    };
};