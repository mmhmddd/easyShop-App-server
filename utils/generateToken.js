const jwt = require('jsonwebtoken');

function generateAuthToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );
}

// Short-lived token proving the user completed OTP verification.
// Signed with a *different* secret than the login token so a leaked
// reset token can never be replayed as a normal auth token.
function generateResetToken(email) {
  return jwt.sign(
    { email, purpose: 'password-reset' },
    process.env.RESET_TOKEN_SECRET,
    { expiresIn: process.env.RESET_TOKEN_EXPIRES_IN || '15m' }
  );
}

function verifyResetToken(token) {
  const decoded = jwt.verify(token, process.env.RESET_TOKEN_SECRET);
  if (decoded.purpose !== 'password-reset') {
    throw new Error('Invalid token purpose');
  }
  return decoded;
}

module.exports = { generateAuthToken, generateResetToken, verifyResetToken };
