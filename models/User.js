const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AddressSchema = new mongoose.Schema(
  {
    label: { type: String, default: 'Home' },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, default: '' },
    country: { type: String, required: true },
    postalCode: { type: String, default: '' },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const UserSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // Not required so social-login accounts (no local password) can
    // exist. select:false keeps it out of normal queries.
    password: { type: String, select: false },
    phone: { type: String, default: '' },
    avatarColor: { type: String, default: '#4F6EF7' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isBlocked: { type: Boolean, default: false },
    provider: {
      type: String,
      enum: ['local', 'google', 'microsoft'],
      default: 'local',
    },
    providerId: { type: String, default: null },
    addresses: [AddressSchema],

    // Password-reset OTP flow
    resetOtpHash: { type: String, select: false },
    resetOtpExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = function comparePassword(candidate) {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.password);
};

UserSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    fullName: this.fullName,
    email: this.email,
    phone: this.phone,
    avatarColor: this.avatarColor,
    role: this.role,
    isBlocked: this.isBlocked,
    provider: this.provider,
    memberSince: this.createdAt,
  };
};

module.exports = mongoose.model('User', UserSchema);
