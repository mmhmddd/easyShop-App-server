const express = require('express');
const {
  listProducts,
  getBestSellers,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

router.get('/', listProducts);
router.get('/best-sellers', getBestSellers);
router.get('/:id', getProduct);

router.post('/', protect, adminOnly, upload.array('images', 5), createProduct);
router.put('/:id', protect, adminOnly, upload.array('images', 5), updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

module.exports = router;
