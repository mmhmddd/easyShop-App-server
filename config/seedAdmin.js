const User = require('../models/User');

const DEFAULT_ADMIN = {
  fullName: 'Tarek Magdy',
  email: 'tarek.magdy@gmail.com',
  password: '123456',
  phone: '01000000002',
  role: 'admin',
};

async function seedAdminUser() {
  try {
    const existing = await User.findOne({ email: DEFAULT_ADMIN.email });
    if (existing) {
      console.log('Default admin already exists, skipping seed.');
      return;
    }
    await User.create(DEFAULT_ADMIN);
    console.log(`Default admin created: ${DEFAULT_ADMIN.email}`);
  } catch (err) {
    console.error('Failed to seed default admin:', err.message);
  }
}

module.exports = seedAdminUser;