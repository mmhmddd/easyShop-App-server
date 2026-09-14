const Product = require('../models/Product');
const Category = require('../models/Category');
const asyncHandler = require('../middleware/asyncHandler');
const slugify = require('../utils/slugify');
const { uploadBufferToCloudinary, deleteFromCloudinary } = require('../middleware/upload');

// GET /api/products?category=&search=&page=&limit=&sort=
const listProducts = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const { category, search, sort } = req.query;

  const filter = { isActive: true };
  if (category && category !== 'all') filter.category = category;
  if (search) filter.$text = { $search: search };

  const sortMap = {
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    newest: { createdAt: -1 },
    rating: { rating: -1 },
  };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name')
      .sort(sortMap[sort] || { createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: products.map((p) => p.toPublicJSON()),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// GET /api/products/best-sellers
const getBestSellers = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
  const products = await Product.find({ isActive: true, isBestSeller: true })
    .populate('category', 'name')
    .sort({ rating: -1 })
    .limit(limit);
  res.json({ success: true, data: products.map((p) => p.toPublicJSON()) });
});

// GET /api/products/:id
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name');
  if (!product || !product.isActive) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json({ success: true, data: product.toPublicJSON() });
});

// POST /api/products  (admin, multipart with "images" field, up to 5)
const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, discountPrice, category, stock, sku, isBestSeller } = req.body;

  if (!name || !price || !category) {
    res.status(400);
    throw new Error('name, price and category are required');
  }

  const categoryDoc = await Category.findById(category);
  if (!categoryDoc) {
    res.status(400);
    throw new Error('Invalid category');
  }

  let slug = slugify(name);
  if (await Product.findOne({ slug })) slug = `${slug}-${Date.now()}`;

  const images = [];
  if (req.files && req.files.length) {
    for (const file of req.files) {
      const uploaded = await uploadBufferToCloudinary(file.buffer, 'shopeasy/products');
      images.push({ url: uploaded.url, publicId: uploaded.publicId });
    }
  }

  const product = await Product.create({
    name,
    slug,
    description,
    price: Number(price),
    discountPrice: discountPrice ? Number(discountPrice) : null,
    category,
    stock: stock ? Number(stock) : 0,
    sku,
    isBestSeller: isBestSeller === 'true' || isBestSeller === true,
    images,
  });

  res.status(201).json({ success: true, data: product.toPublicJSON() });
});

// PUT /api/products/:id  (admin, multipart with optional new "images")
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const {
    name, description, price, discountPrice, category,
    stock, sku, isBestSeller, isActive, removeImageIds,
  } = req.body;

  if (name && name !== product.name) {
    product.name = name;
    let slug = slugify(name);
    if (await Product.findOne({ slug, _id: { $ne: product._id } })) slug = `${slug}-${Date.now()}`;
    product.slug = slug;
  }
  if (description !== undefined) product.description = description;
  if (price !== undefined) product.price = Number(price);
  if (discountPrice !== undefined) product.discountPrice = discountPrice ? Number(discountPrice) : null;
  if (category) {
    if (!(await Category.findById(category))) {
      res.status(400);
      throw new Error('Invalid category');
    }
    product.category = category;
  }
  if (stock !== undefined) product.stock = Number(stock);
  if (sku !== undefined) product.sku = sku;
  if (isBestSeller !== undefined) product.isBestSeller = isBestSeller === 'true' || isBestSeller === true;
  if (isActive !== undefined) product.isActive = isActive === 'true' || isActive === true;

  // Remove specific existing images by publicId (comma-separated list)
  if (removeImageIds) {
    const idsToRemove = String(removeImageIds).split(',').map((s) => s.trim());
    for (const publicId of idsToRemove) {
      await deleteFromCloudinary(publicId);
    }
    product.images = product.images.filter((img) => !idsToRemove.includes(img.publicId));
  }

  // Append any newly uploaded images
  if (req.files && req.files.length) {
    for (const file of req.files) {
      const uploaded = await uploadBufferToCloudinary(file.buffer, 'shopeasy/products');
      product.images.push({ url: uploaded.url, publicId: uploaded.publicId });
    }
  }

  await product.save();
  res.json({ success: true, data: product.toPublicJSON() });
});

// DELETE /api/products/:id  (admin)
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  for (const img of product.images) {
    await deleteFromCloudinary(img.publicId);
  }
  await product.deleteOne();

  res.json({ success: true, message: 'Product deleted' });
});

module.exports = {
  listProducts,
  getBestSellers,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};
