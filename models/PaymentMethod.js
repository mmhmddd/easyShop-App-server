const mongoose = require('mongoose');

/// IMPORTANT — PCI-DSS note:
/// This collection deliberately never stores a full card number, CVV,
/// or expiry beyond MM/YY. It only holds the non-sensitive metadata
/// (brand, last 4 digits, expiry) needed to display a saved card in
/// the UI, plus an optional `gatewayToken` for a real processor
/// (Stripe/Paymob/etc.) that would actually own the card data. Do not
/// add raw PAN/CVV fields here.
const PaymentMethodSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    brand: { type: String, enum: ['visa', 'mastercard', 'other'], default: 'other' },
    last4: { type: String, required: true, match: /^\d{4}$/ },
    expiry: { type: String, required: true }, // "MM/YY"
    isDefault: { type: Boolean, default: false },
    gatewayToken: { type: String, default: null },
  },
  { timestamps: true }
);

PaymentMethodSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    brand: this.brand,
    last4: this.last4,
    expiry: this.expiry,
    isDefault: this.isDefault,
  };
};

module.exports = mongoose.model('PaymentMethod', PaymentMethodSchema);
