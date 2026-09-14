const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const asyncHandler = require('../middleware/asyncHandler');

async function getOrCreateWishlist(userId) {
  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) wishlist = await Wishlist.create({ user: userId, products: [] });
  return wishlist;
}

// GET /api/wishlist
const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await (await getOrCreateWishlist(req.user._id)).populate('products');
  const products = wishlist.products.filter((p) => p && p.isActive);
  res.json({ success: true, data: products.map((p) => p.toPublicJSON()) });
});

// POST /api/wishlist/:productId
const addToWishlist = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const wishlist = await getOrCreateWishlist(req.user._id);
  if (!wishlist.products.some((id) => id.toString() === req.params.productId)) {
    wishlist.products.push(req.params.productId);
    await wishlist.save();
  }

  await wishlist.populate('products');
  res.status(201).json({ success: true, data: wishlist.products.map((p) => p.toPublicJSON()) });
});

// DELETE /api/wishlist/:productId
const removeFromWishlist = asyncHandler(async (req, res) => {
  const wishlist = await getOrCreateWishlist(req.user._id);
  wishlist.products = wishlist.products.filter((id) => id.toString() !== req.params.productId);
  await wishlist.save();
  await wishlist.populate('products');
  res.json({ success: true, data: wishlist.products.map((p) => p.toPublicJSON()) });
});

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
