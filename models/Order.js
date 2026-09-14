const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    image: { type: String, default: null },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const ShippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, default: '' },
    country: { type: String, required: true },
    postalCode: { type: String, default: '' },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [OrderItemSchema], required: true },
    shippingAddress: { type: ShippingAddressSchema, required: true },
    paymentMethodSnapshot: {
      brand: { type: String, default: 'other' },
      last4: { type: String, default: '' },
    },
    subtotal: { type: Number, required: true },
    shippingFee: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ['processing', 'shipped', 'delivered', 'cancelled'],
      default: 'processing',
    },
    statusHistory: {
      type: [
        {
          status: String,
          changedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

OrderSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    orderNumber: this.orderNumber,
    items: this.items,
    shippingAddress: this.shippingAddress,
    subtotal: this.subtotal,
    shippingFee: this.shippingFee,
    total: this.total,
    itemCount: this.items.reduce((sum, i) => sum + i.quantity, 0),
    status: this.status,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('Order', OrderSchema);
