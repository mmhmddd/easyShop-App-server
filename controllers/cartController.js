const Cart = require('../models/Cart');
const Product = require('../models/Product');
const asyncHandler = require('../middleware/asyncHandler');

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
}

function serializeCart(cart) {
  const items = cart.items
    .filter((item) => item.product) // guard against a deleted product
    .map((item) => {
      const p = item.product;
      const price = p.discountPrice ?? p.price;
      return {
        productId: p._id,
        name: p.name,
        image: p.images?.[0]?.url || null,
        price,
        quantity: item.quantity,
        lineTotal: price * item.quantity,
      };
    });

  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  return { items, subtotal, itemCount: items.reduce((sum, i) => sum + i.quantity, 0) };
}

// GET /api/cart
const getCart = asyncHandler(async (req, res) => {
  const cart = await (await getOrCreateCart(req.user._id)).populate('items.product');
  res.json({ success: true, data: serializeCart(cart) });
});

// POST /api/cart/items  { productId, quantity }
const addItem = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    res.status(404);
    throw new Error('Product not found');
  }
  if (quantity < 1) {
    res.status(400);
    throw new Error('Quantity must be at least 1');
  }

  const cart = await getOrCreateCart(req.user._id);
  const existing = cart.items.find((i) => i.product.toString() === productId);

  if (existing) {
    existing.quantity += Number(quantity);
  } else {
    cart.items.push({ product: productId, quantity: Number(quantity) });
  }

  await cart.save();
  await cart.populate('items.product');
  res.status(201).json({ success: true, data: serializeCart(cart) });
});

// PUT /api/cart/items/:productId  { quantity }
const updateItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) {
    res.status(400);
    throw new Error('Quantity must be at least 1');
  }

  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.find((i) => i.product.toString() === req.params.productId);
  if (!item) {
    res.status(404);
    throw new Error('Item not found in cart');
  }

  item.quantity = Number(quantity);
  await cart.save();
  await cart.populate('items.product');
  res.json({ success: true, data: serializeCart(cart) });
});

// DELETE /api/cart/items/:productId
const removeItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);
  await cart.save();
  await cart.populate('items.product');
  res.json({ success: true, data: serializeCart(cart) });
});

// DELETE /api/cart
const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  await cart.save();
  res.json({ success: true, data: serializeCart(cart) });
});

module.exports = { getCart, addItem, updateItem, removeItem, clearCart, getOrCreateCart, serializeCart };
