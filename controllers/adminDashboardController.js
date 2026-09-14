const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const asyncHandler = require('../middleware/asyncHandler');

function percentChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10; // 1 decimal place
}

// GET /api/admin/dashboard/stats
// Feeds the 4 StatisticCard widgets on admin_dashboard_screen.dart.
const getStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const revenueSince = async (from, to) => {
    const result = await Order.aggregate([
      {
        $match: {
          status: { $ne: 'cancelled' },
          createdAt: to ? { $gte: from, $lt: to } : { $gte: from },
        },
      },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
    ]);
    return result[0] || { total: 0, count: 0 };
  };

  const [
    thisMonth,
    lastMonth,
    totalUsers,
    usersThisMonth,
    usersLastMonth,
    totalProducts,
    productsThisMonth,
    productsLastMonth,
    totalOrders,
  ] = await Promise.all([
    revenueSince(startOfThisMonth),
    revenueSince(startOfLastMonth, startOfThisMonth),
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: startOfThisMonth } }),
    User.countDocuments({ createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth } }),
    Product.countDocuments(),
    Product.countDocuments({ createdAt: { $gte: startOfThisMonth } }),
    Product.countDocuments({ createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth } }),
    Order.countDocuments(),
  ]);

  res.json({
    success: true,
    data: {
      revenue: {
        value: thisMonth.total,
        changePercent: percentChange(thisMonth.total, lastMonth.total),
      },
      orders: {
        value: totalOrders,
        changePercent: percentChange(thisMonth.count, lastMonth.count),
      },
      users: {
        value: totalUsers,
        changePercent: percentChange(usersThisMonth, usersLastMonth),
      },
      products: {
        value: totalProducts,
        changePercent: percentChange(productsThisMonth, productsLastMonth),
      },
    },
  });
});

// GET /api/admin/dashboard/sales-chart?range=week|month|year
// Feeds sales_chart.dart.
const getSalesChart = asyncHandler(async (req, res) => {
  const range = ['week', 'month', 'year'].includes(req.query.range) ? req.query.range : 'week';

  const now = new Date();
  let from;
  let dateFormat;
  if (range === 'week') {
    from = new Date(now);
    from.setDate(now.getDate() - 6);
    dateFormat = '%Y-%m-%d';
  } else if (range === 'month') {
    from = new Date(now);
    from.setDate(now.getDate() - 29);
    dateFormat = '%Y-%m-%d';
  } else {
    from = new Date(now.getFullYear(), 0, 1);
    dateFormat = '%Y-%m';
  }
  from.setHours(0, 0, 0, 0);

  const results = await Order.aggregate([
    { $match: { createdAt: { $gte: from }, status: { $ne: 'cancelled' } } },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
        revenue: { $sum: '$total' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({
    success: true,
    data: results.map((r) => ({ label: r._id, revenue: r.revenue, orders: r.orders })),
  });
});

// GET /api/admin/dashboard/recent-orders?limit=5
// Feeds recent_orders.dart.
const getRecentOrders = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 5, 20);

  const orders = await Order.find()
    .populate('user', 'fullName email')
    .sort({ createdAt: -1 })
    .limit(limit);

  res.json({
    success: true,
    data: orders.map((o) => ({
      ...o.toPublicJSON(),
      customer: o.user ? { fullName: o.user.fullName, email: o.user.email } : null,
    })),
  });
});

module.exports = { getStats, getSalesChart, getRecentOrders };
