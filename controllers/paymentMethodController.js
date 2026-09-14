const PaymentMethod = require('../models/PaymentMethod');
const asyncHandler = require('../middleware/asyncHandler');

// GET /api/payment-methods
const listPaymentMethods = asyncHandler(async (req, res) => {
  const methods = await PaymentMethod.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
  res.json({ success: true, data: methods.map((m) => m.toPublicJSON()) });
});

// POST /api/payment-methods
// Body: { brand, last4, expiry, isDefault, gatewayToken? }
// NOTE: this only ever stores last4 + expiry (never a full card
// number or CVV). Wire a real processor (Stripe, Paymob, ...) on the
// client and pass its returned token as `gatewayToken` when ready.
const addPaymentMethod = asyncHandler(async (req, res) => {
  const { brand, last4, expiry, isDefault, gatewayToken } = req.body;

  if (!last4 || !/^\d{4}$/.test(last4) || !expiry) {
    res.status(400);
    throw new Error('last4 (4 digits) and expiry (MM/YY) are required');
  }

  if (isDefault) {
    await PaymentMethod.updateMany({ user: req.user._id }, { isDefault: false });
  }

  const existingCount = await PaymentMethod.countDocuments({ user: req.user._id });

  const method = await PaymentMethod.create({
    user: req.user._id,
    brand: ['visa', 'mastercard'].includes(brand) ? brand : 'other',
    last4,
    expiry,
    isDefault: !!isDefault || existingCount === 0,
    gatewayToken: gatewayToken || null,
  });

  res.status(201).json({ success: true, data: method.toPublicJSON() });
});

// PUT /api/payment-methods/:id/default
const setDefaultPaymentMethod = asyncHandler(async (req, res) => {
  const method = await PaymentMethod.findOne({ _id: req.params.id, user: req.user._id });
  if (!method) {
    res.status(404);
    throw new Error('Payment method not found');
  }

  await PaymentMethod.updateMany({ user: req.user._id }, { isDefault: false });
  method.isDefault = true;
  await method.save();

  res.json({ success: true, data: method.toPublicJSON() });
});

// DELETE /api/payment-methods/:id
const deletePaymentMethod = asyncHandler(async (req, res) => {
  const method = await PaymentMethod.findOne({ _id: req.params.id, user: req.user._id });
  if (!method) {
    res.status(404);
    throw new Error('Payment method not found');
  }
  await method.deleteOne();
  res.json({ success: true, message: 'Payment method removed' });
});

module.exports = { listPaymentMethods, addPaymentMethod, setDefaultPaymentMethod, deletePaymentMethod };
