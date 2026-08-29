const Order = require("../models/Order");
const { ORDER_STATUS } = require("../utils/constants");

const generateSalesReport = async (
    startDate,
    endDate
) => {
    const orders = await Order.find({
        createdAt: {
            $gte: startDate,
            $lt: endDate
        }
    });

    const completedOrders = orders.filter(
        order => order.status === ORDER_STATUS.COMPLETED
    );

    const cancelledOrders = orders.filter(
        order => order.status === ORDER_STATUS.CANCELLED
    );

    const totalRevenue = completedOrders.reduce(
        (sum, order) => sum + order.totalAmount,
        0
    );

    return {
        generatedAt: new Date(),

        period: {
            start: startDate,
            end: endDate
        },

        metrics: {
            totalOrders: orders.length,
            completedOrders: completedOrders.length,
            cancelledOrders: cancelledOrders.length,
            totalRevenue: Number(
                totalRevenue.toFixed(2)
            )
        }
    };
};
module.exports = { generateSalesReport };
