const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const sendEmail = require('../utils/sendEmail');
const { passwordChangedEmailTemplate } = require('../utils/emailTemplates');
const { isValidEmail, isStrongEnoughPassword } = require('../utils/validate');

// GET /api/users/me
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user.toPublicJSON() });
});

// PUT /api/users/me
const updateMe = asyncHandler(async (req, res) => {
  const { fullName, email, phone } = req.body;

  if (email && !isValidEmail(email)) {
    res.status(400);
    throw new Error('Please provide a valid email');
  }

  if (email && email.toLowerCase().trim() !== req.user.email) {
    const taken = await User.findOne({ email: email.toLowerCase().trim() });
    if (taken) {
      res.status(400);
      throw new Error('An account with this email already exists');
    }
    req.user.email = email.toLowerCase().trim();
  }

  if (fullName) req.user.fullName = fullName.trim();
  if (phone !== undefined) req.user.phone = phone.trim();

  await req.user.save();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: req.user.toPublicJSON(),
  });
});

// PUT /api/users/me/password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!isStrongEnoughPassword(newPassword)) {
    res.status(400);
    throw new Error('New password must be at least 6 characters');
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  sendEmail({
    to: user.email,
    subject: 'Your ShopEasy password was changed',
    html: passwordChangedEmailTemplate({ fullName: user.fullName }),
  }).catch((err) => console.error('Failed to send password-changed email:', err.message));

  res.json({ success: true, message: 'Password changed successfully' });
});

// ---- Addresses ----

// GET /api/users/me/addresses
const getAddresses = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user.addresses });
});

// POST /api/users/me/addresses
const addAddress = asyncHandler(async (req, res) => {
  const { label, fullName, phone, street, city, state, country, postalCode, isDefault } = req.body;

  if (!fullName || !phone || !street || !city || !country) {
    res.status(400);
    throw new Error('fullName, phone, street, city and country are required');
  }

  if (isDefault) {
    req.user.addresses.forEach((a) => { a.isDefault = false; });
  }

  req.user.addresses.push({
    label, fullName, phone, street, city, state, country, postalCode,
    isDefault: !!isDefault || req.user.addresses.length === 0,
  });

  await req.user.save();
  res.status(201).json({ success: true, data: req.user.addresses });
});

// PUT /api/users/me/addresses/:addressId
const updateAddress = asyncHandler(async (req, res) => {
  const address = req.user.addresses.id(req.params.addressId);
  if (!address) {
    res.status(404);
    throw new Error('Address not found');
  }

  const fields = ['label', 'fullName', 'phone', 'street', 'city', 'state', 'country', 'postalCode'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) address[f] = req.body[f];
  });

  if (req.body.isDefault) {
    req.user.addresses.forEach((a) => { a.isDefault = false; });
    address.isDefault = true;
  }

  await req.user.save();
  res.json({ success: true, data: req.user.addresses });
});

// DELETE /api/users/me/addresses/:addressId
const deleteAddress = asyncHandler(async (req, res) => {
  const address = req.user.addresses.id(req.params.addressId);
  if (!address) {
    res.status(404);
    throw new Error('Address not found');
  }
  address.deleteOne();
  await req.user.save();
  res.json({ success: true, data: req.user.addresses });
});

// ---- Admin: user management ----

// GET /api/admin/users?search=&page=&limit=
const adminListUsers = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const { search } = req.query;

  const filter = {};
  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: users.map((u) => u.toPublicJSON()),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// GET /api/admin/users/:id
const adminGetUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json({ success: true, data: { ...user.toPublicJSON(), addresses: user.addresses } });
});

// PUT /api/admin/users/:id
const adminUpdateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const { role, isBlocked, fullName, phone } = req.body;
  if (role && ['user', 'admin'].includes(role)) user.role = role;
  if (isBlocked !== undefined) user.isBlocked = !!isBlocked;
  if (fullName) user.fullName = fullName;
  if (phone !== undefined) user.phone = phone;

  await user.save();
  res.json({ success: true, data: user.toPublicJSON() });
});

// DELETE /api/admin/users/:id
const adminDeleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  await user.deleteOne();
  res.json({ success: true, message: 'User deleted' });
});

module.exports = {
  getMe,
  updateMe,
  changePassword,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  adminListUsers,
  adminGetUser,
  adminUpdateUser,
  adminDeleteUser,
};
