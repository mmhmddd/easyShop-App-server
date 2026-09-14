const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const { generateAuthToken, generateResetToken, verifyResetToken } = require('../utils/generateToken');
const { generateOtp, hashOtp } = require('../utils/otp');
const sendEmail = require('../utils/sendEmail');
const { otpEmailTemplate, passwordChangedEmailTemplate } = require('../utils/emailTemplates');
const { isValidEmail, isStrongEnoughPassword } = require('../utils/validate');

const OTP_EXPIRY_MINUTES = 10;

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !isValidEmail(email) || !isStrongEnoughPassword(password)) {
    res.status(400);
    throw new Error('Please provide a valid full name, email and a password of at least 6 characters');
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    res.status(400);
    throw new Error('An account with this email already exists');
  }

  const user = await User.create({
    fullName: fullName.trim(),
    email: email.toLowerCase().trim(),
    password,
  });

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    data: {
      token: generateAuthToken(user),
      user: user.toPublicJSON(),
    },
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!isValidEmail(email) || !password) {
    res.status(400);
    throw new Error('Please provide a valid email and password');
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (user.isBlocked) {
    res.status(403);
    throw new Error('This account has been blocked. Contact support.');
  }

  res.json({
    success: true,
    message: 'Logged in successfully',
    data: {
      token: generateAuthToken(user),
      user: user.toPublicJSON(),
    },
  });
});

// POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!isValidEmail(email)) {
    res.status(400);
    throw new Error('Please provide a valid email');
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  // Always respond with success even if the email isn't registered —
  // this avoids leaking which emails have accounts.
  if (!user) {
    return res.json({
      success: true,
      message: 'If that email is registered, a verification code has been sent',
    });
  }

  const otp = generateOtp();
  user.resetOtpHash = hashOtp(otp);
  user.resetOtpExpires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  await user.save();

  await sendEmail({
    to: user.email,
    subject: 'Your ShopEasy verification code',
    html: otpEmailTemplate({
      fullName: user.fullName,
      otp,
      expiresInMinutes: OTP_EXPIRY_MINUTES,
    }),
  });

  res.json({
    success: true,
    message: 'Verification code sent to your email',
  });
});

// POST /api/auth/verify-reset-code
const verifyResetCode = asyncHandler(async (req, res) => {
  const { email, code } = req.body;

  if (!isValidEmail(email) || !code) {
    res.status(400);
    throw new Error('Please provide a valid email and code');
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    '+resetOtpHash +resetOtpExpires'
  );

  if (
    !user ||
    !user.resetOtpHash ||
    !user.resetOtpExpires ||
    user.resetOtpExpires < new Date() ||
    user.resetOtpHash !== hashOtp(String(code).trim())
  ) {
    res.status(400);
    throw new Error('Invalid or expired verification code');
  }

  res.json({
    success: true,
    message: 'Code verified',
    resetToken: generateResetToken(user.email),
  });
});

// POST /api/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { email, resetToken, newPassword } = req.body;

  if (!isValidEmail(email) || !resetToken || !isStrongEnoughPassword(newPassword)) {
    res.status(400);
    throw new Error('Please provide a valid email, reset token, and a new password of at least 6 characters');
  }

  let decoded;
  try {
    decoded = verifyResetToken(resetToken);
  } catch (err) {
    res.status(400);
    throw new Error('Reset token is invalid or has expired. Please request a new code.');
  }

  if (decoded.email !== email.toLowerCase().trim()) {
    res.status(400);
    throw new Error('Reset token does not match this email');
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.password = newPassword;
  user.resetOtpHash = undefined;
  user.resetOtpExpires = undefined;
  await user.save();

  sendEmail({
    to: user.email,
    subject: 'Your ShopEasy password was changed',
    html: passwordChangedEmailTemplate({ fullName: user.fullName }),
  }).catch((err) => console.error('Failed to send password-changed email:', err.message));

  res.json({ success: true, message: 'Password reset successfully' });
});

// POST /api/auth/google
// Body: { idToken }  — idToken comes from google_sign_in on the client.
const googleLogin = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  if (!process.env.GOOGLE_CLIENT_ID) {
    res.status(501);
    throw new Error('Google sign-in is not configured on the server (missing GOOGLE_CLIENT_ID)');
  }
  if (!idToken) {
    res.status(400);
    throw new Error('idToken is required');
  }

  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    res.status(401);
    throw new Error('Invalid Google token');
  }

  const user = await findOrCreateSocialUser({
    email: payload.email,
    fullName: payload.name || payload.email.split('@')[0],
    provider: 'google',
    providerId: payload.sub,
  });

  res.json({
    success: true,
    message: 'Logged in with Google successfully',
    data: { token: generateAuthToken(user), user: user.toPublicJSON() },
  });
});

// POST /api/auth/microsoft
// Body: { accessToken } — accessToken comes from msal_auth on the
// client. We validate it by calling Microsoft Graph directly, which
// needs no extra server-side secret.
const microsoftLogin = asyncHandler(async (req, res) => {
  const { accessToken } = req.body;

  if (!accessToken) {
    res.status(400);
    throw new Error('accessToken is required');
  }

  let profile;
  try {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) throw new Error('Graph request failed');
    profile = await response.json();
  } catch (err) {
    res.status(401);
    throw new Error('Invalid Microsoft access token');
  }

  const email = profile.mail || profile.userPrincipalName;
  if (!email) {
    res.status(400);
    throw new Error('Could not read an email address from this Microsoft account');
  }

  const user = await findOrCreateSocialUser({
    email,
    fullName: profile.displayName || email.split('@')[0],
    provider: 'microsoft',
    providerId: profile.id,
  });

  res.json({
    success: true,
    message: 'Logged in with Microsoft successfully',
    data: { token: generateAuthToken(user), user: user.toPublicJSON() },
  });
});

async function findOrCreateSocialUser({ email, fullName, provider, providerId }) {
  const normalizedEmail = email.toLowerCase().trim();
  let user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    user = await User.create({
      fullName,
      email: normalizedEmail,
      provider,
      providerId,
    });
  } else if (user.isBlocked) {
    const err = new Error('This account has been blocked. Contact support.');
    err.statusCode = 403;
    throw err;
  }

  return user;
}

module.exports = {
  register,
  login,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  googleLogin,
  microsoftLogin,
};
