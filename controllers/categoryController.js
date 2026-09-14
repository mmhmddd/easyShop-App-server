const Category = require('../models/Category');
const Product = require('../models/Product');
const asyncHandler = require('../middleware/asyncHandler');
const slugify = require('../utils/slugify');
const { uploadBufferToCloudinary, deleteFromCloudinary } = require('../middleware/upload');

// GET /api/categories
const listCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, createdAt: 1 });
  res.json({ success: true, data: categories.map((c) => c.toPublicJSON()) });
});

// POST /api/categories  (admin, multipart with optional "image")
const createCategory = asyncHandler(async (req, res) => {
  const { name, icon, sortOrder } = req.body;
  if (!name) {
    res.status(400);
    throw new Error('name is required');
  }

  const slug = slugify(name);
  if (await Category.findOne({ slug })) {
    res.status(400);
    throw new Error('A category with this name already exists');
  }

  let image = { url: null, publicId: null };
  if (req.file) {
    const uploaded = await uploadBufferToCloudinary(req.file.buffer, 'shopeasy/categories');
    image = { url: uploaded.url, publicId: uploaded.publicId };
  }

  const category = await Category.create({
    name, slug, icon, image, sortOrder: sortOrder ? Number(sortOrder) : 0,
  });

  res.status(201).json({ success: true, data: category.toPublicJSON() });
});

// PUT /api/categories/:id  (admin, multipart with optional "image")
const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  const { name, icon, isActive, sortOrder } = req.body;

  if (name && name !== category.name) {
    category.name = name;
    category.slug = slugify(name);
  }
  if (icon) category.icon = icon;
  if (isActive !== undefined) category.isActive = isActive === 'true' || isActive === true;
  if (sortOrder !== undefined) category.sortOrder = Number(sortOrder);

  if (req.file) {
    if (category.image?.publicId) await deleteFromCloudinary(category.image.publicId);
    const uploaded = await uploadBufferToCloudinary(req.file.buffer, 'shopeasy/categories');
    category.image = { url: uploaded.url, publicId: uploaded.publicId };
  }

  await category.save();
  res.json({ success: true, data: category.toPublicJSON() });
});

// DELETE /api/categories/:id  (admin)
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  const productCount = await Product.countDocuments({ category: category._id });
  if (productCount > 0) {
    res.status(400);
    throw new Error(`Cannot delete: ${productCount} product(s) still use this category`);
  }

  if (category.image?.publicId) await deleteFromCloudinary(category.image.publicId);
  await category.deleteOne();

  res.json({ success: true, message: 'Category deleted' });
});

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
