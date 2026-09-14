const crypto = require('crypto');

function generateOtp() {
  // 6-digit numeric code, matches the Flutter app's
  // Validators.code(value, length: 6) expectation.
  return crypto.randomInt(100000, 1000000).toString();
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

module.exports = { generateOtp, hashOtp };
