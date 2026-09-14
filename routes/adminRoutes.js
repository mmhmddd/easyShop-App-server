const express = require('express');
const { protect, adminOnly } = require('../middleware/auth');
const {
  adminListUsers,
  adminGetUser,
  adminUpdateUser,
  adminDeleteUser,
} = require('../controllers/userController');
const {
  adminListOrders,
  adminGetOrder,
  adminUpdateOrderStatus,
} = require('../controllers/orderController');
const { getStats, getSalesChart, getRecentOrders } = require('../controllers/adminDashboardController');

const router = express.Router();

// Every route below requires an authenticated admin.
router.use(protect, adminOnly);

// Dashboard
router.get('/dashboard/stats', getStats);
router.get('/dashboard/sales-chart', getSalesChart);
router.get('/dashboard/recent-orders', getRecentOrders);

// Users
router.get('/users', adminListUsers);
router.get('/users/:id', adminGetUser);
router.put('/users/:id', adminUpdateUser);
router.delete('/users/:id', adminDeleteUser);

// Orders
router.get('/orders', adminListOrders);
router.get('/orders/:id', adminGetOrder);
router.put('/orders/:id/status', adminUpdateOrderStatus);

// Product & category CRUD live in productRoutes.js / categoryRoutes.js
// (mounted at /api/products and /api/categories) since they're
// naturally RESTful there too — POST/PUT/DELETE on those routers are
// already gated with `adminOnly`.

module.exports = router;
