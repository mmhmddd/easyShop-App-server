const express = require('express');
const {
  listPaymentMethods,
  addPaymentMethod,
  setDefaultPaymentMethod,
  deletePaymentMethod,
} = require('../controllers/paymentMethodController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/', listPaymentMethods);
router.post('/', addPaymentMethod);
router.put('/:id/default', setDefaultPaymentMethod);
router.delete('/:id', deletePaymentMethod);

module.exports = router;
