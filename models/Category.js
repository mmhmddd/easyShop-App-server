const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    // Name of a Material icon (e.g. "directions_walk_rounded"). The
    // Flutter app maps this string to an IconData via a lookup table,
    // the same way CategoryModel.icon works today, without needing
    // per-category image assets.
    icon: { type: String, default: 'category_rounded' },
    image: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
    },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

CategorySchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    name: this.name,
    slug: this.slug,
    icon: this.icon,
    imageUrl: this.image?.url || null,
    isActive: this.isActive,
  };
};

module.exports = mongoose.model('Category', CategorySchema);
