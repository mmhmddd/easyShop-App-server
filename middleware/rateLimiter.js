const rateLimit = require('express-rate-limit');

// Applied to login/register/forgot-password to slow down brute-force
// and OTP-spam attempts.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please try again later' },
});

module.exports = { authLimiter };
