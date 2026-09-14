const jwt = require('jsonwebtoken');
const asyncHandler = require('./asyncHandler');
const User = require('../models/User');

// Verifies the Bearer token and attaches the full user document
// (minus password) to req.user.
const protect = asyncHandler(async (req, res, next) => {
  let token;
  const header = req.headers.authorization;

  if (header && header.startsWith('Bearer ')) {
    token = header.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    res.status(401);
    throw new Error('Not authorized, token is invalid or expired');
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    res.status(401);
    throw new Error('Not authorized, user no longer exists');
  }
  if (user.isBlocked) {
    res.status(403);
    throw new Error('This account has been blocked');
  }

  req.user = user;
  next();
});

// Use after `protect`. Restricts a route to admin accounts.
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  res.status(403);
  throw new Error('Admin access required');
};

module.exports = { protect, adminOnly };
