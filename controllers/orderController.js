const Order = require('../models/Order');
const Product = require('../models/Product');
const PaymentMethod = require('../models/PaymentMethod');
const { getOrCreateCart } = require('./cartController');
const asyncHandler = require('../middleware/asyncHandler');

const SHIPPING_FEE = 0; // flat-rate placeholder; wire real shipping rules later

function generateOrderNumber() {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `#SE-${Date.now().toString().slice(-6)}${rand}`;
}

// POST /api/orders  — checkout the current cart
// Body: { addressId?, shippingAddress?, paymentMethodId? }
const createOrder = asyncHandler(async (req, res) => {
  const { addressId, shippingAddress, paymentMethodId } = req.body;

  const cart = await (await getOrCreateCart(req.user._id)).populate('items.product');
  if (!cart.items.length) {
    res.status(400);
    throw new Error('Your cart is empty');
  }

  // Resolve shipping address: either a saved address by id, or an
  // inline address object passed directly.
  let resolvedAddress = shippingAddress;
  if (addressId) {
    const saved = req.user.addresses.id(addressId);
    if (!saved) {
      res.status(400);
      throw new Error('Address not found');
    }
    resolvedAddress = {
      fullName: saved.fullName,
      phone: saved.phone,
      street: saved.street,
      city: saved.city,
      state: saved.state,
      country: saved.country,
      postalCode: saved.postalCode,
    };
  }
  if (!resolvedAddress || !resolvedAddress.fullName || !resolvedAddress.street) {
    res.status(400);
    throw new Error('A valid shipping address is required');
  }

  // Resolve payment method snapshot (metadata only).
  let paymentMethodSnapshot = { brand: 'other', last4: '' };
  if (paymentMethodId) {
    const method = await PaymentMethod.findOne({ _id: paymentMethodId, user: req.user._id });
    if (!method) {
      res.status(400);
      throw new Error('Payment method not found');
    }
    paymentMethodSnapshot = { brand: method.brand, last4: method.last4 };
  }

  // Validate stock and build order items atomically-ish (best effort
  // without a multi-document transaction, which needs a replica set).
  const items = [];
  for (const cartItem of cart.items) {
    const product = cartItem.product;
    if (!product || !product.isActive) {
      res.status(400);
      throw new Error(`A product in your cart is no longer available`);
    }
    if (product.stock < cartItem.quantity) {
      res.status(400);
      throw new Error(`Not enough stock for "${product.name}"`);
    }
    items.push({
      product: product._id,
      name: product.name,
      image: product.images?.[0]?.url || null,
      price: product.discountPrice ?? product.price,
      quantity: cartItem.quantity,
    });
  }

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    user: req.user._id,
    items,
    shippingAddress: resolvedAddress,
    paymentMethodSnapshot,
    subtotal,
    shippingFee: SHIPPING_FEE,
    total: subtotal + SHIPPING_FEE,
    status: 'processing',
    statusHistory: [{ status: 'processing' }],
  });

  // Decrement stock for each purchased product.
  await Promise.all(
    items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: -i.quantity } }))
  );

  cart.items = [];
  await cart.save();

  res.status(201).json({ success: true, data: order.toPublicJSON() });
});

// GET /api/orders  — current user's order history
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: orders.map((o) => o.toPublicJSON()) });
});

// GET /api/orders/:id
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to view this order');
  }
  res.json({ success: true, data: order.toPublicJSON() });
});

// ---- Admin ----

// GET /api/admin/orders?status=&page=&limit=
const adminListOrders = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const { status } = req.query;

  const filter = {};
  if (status) filter.status = status;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'fullName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: orders.map((o) => ({
      ...o.toPublicJSON(),
      customer: o.user ? { id: o.user._id, fullName: o.user.fullName, email: o.user.email } : null,
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// GET /api/admin/orders/:id
const adminGetOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'fullName email phone');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  res.json({
    success: true,
    data: {
      ...order.toPublicJSON(),
      customer: order.user
        ? { id: order.user._id, fullName: order.user.fullName, email: order.user.email, phone: order.user.phone }
        : null,
    },
  });
});

// PUT /api/admin/orders/:id/status  { status }
const adminUpdateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error(`status must be one of: ${validStatuses.join(', ')}`);
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  order.status = status;
  order.statusHistory.push({ status });
  await order.save();

  res.json({ success: true, data: order.toPublicJSON() });
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  adminListOrders,
  adminGetOrder,
  adminUpdateOrderStatus,
};
