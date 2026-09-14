const express = require('express');
const {
  register,
  login,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  googleLogin,
  microsoftLogin,
} = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Paths mirror lib/core/network/api_endpoints.dart exactly, plus
// /login which the Flutter app doesn't have a constant for yet.
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/verify-reset-code', authLimiter, verifyResetCode);
router.post('/reset-password', authLimiter, resetPassword);
router.post('/google', authLimiter, googleLogin);
router.post('/microsoft', authLimiter, microsoftLogin);

module.exports = router;
