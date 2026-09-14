const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: null },
  },
  { _id: false }
);

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, default: null, min: 0 },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    images: { type: [ImageSchema], default: [] },
    stock: { type: Number, default: 0, min: 0 },
    sku: { type: String, default: '' },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    isBestSeller: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ProductSchema.index({ name: 'text', description: 'text' });

ProductSchema.virtual('effectivePrice').get(function effectivePrice() {
  return this.discountPrice ?? this.price;
});

ProductSchema.set('toJSON', { virtuals: true });

ProductSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    name: this.name,
    slug: this.slug,
    description: this.description,
    price: this.price,
    discountPrice: this.discountPrice,
    categoryId: this.category?._id || this.category,
    categoryName: this.category?.name,
    images: this.images.map((img) => img.url),
    stock: this.stock,
    rating: this.rating,
    reviewCount: this.reviewCount,
    isBestSeller: this.isBestSeller,
    isActive: this.isActive,
  };
};

module.exports = mongoose.model('Product', ProductSchema);
