// One-off helper to promote an existing user to admin, since there's
// no public "become admin" endpoint (for obvious reasons).
//
// Usage:  node utils/makeAdmin.js someone@example.com
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

async function run() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node utils/makeAdmin.js someone@example.com');
    process.exit(1);
  }

  await connectDB();
  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase().trim() },
    { role: 'admin' },
    { new: true }
  );

  if (!user) {
    console.error('No user found with that email');
  } else {
    console.log(`${user.email} is now an admin.`);
  }

  await mongoose.disconnect();
  process.exit(user ? 0 : 1);
}

run();
