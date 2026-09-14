const express = require('express');
const {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect, adminOnly } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

router.get('/', listCategories);
router.post('/', protect, adminOnly, upload.single('image'), createCategory);
router.put('/:id', protect, adminOnly, upload.single('image'), updateCategory);
router.delete('/:id', protect, adminOnly, deleteCategory);

module.exports = router;
