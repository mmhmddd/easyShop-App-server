const express = require('express');
const {
  getMe,
  updateMe,
  changePassword,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/me', getMe);
router.put('/me', updateMe);
router.put('/me/password', changePassword);

router.get('/me/addresses', getAddresses);
router.post('/me/addresses', addAddress);
router.put('/me/addresses/:addressId', updateAddress);
router.delete('/me/addresses/:addressId', deleteAddress);

module.exports = router;
