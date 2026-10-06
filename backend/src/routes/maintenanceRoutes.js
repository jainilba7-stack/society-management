const express = require('express');
const router = express.Router();
const {
  createMaintenanceBill,
  getBills,
  getPayments,
  createRazorpayOrder,
  processPaymentVerification,
  getReceipt,
} = require('../controllers/maintenanceController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

const upload = require('../middlewares/uploadMiddleware');

router.post('/bills', protect, authorize('admin'), upload.single('billImage'), createMaintenanceBill);
router.get('/bills', protect, getBills);
router.get('/payments', protect, getPayments);
router.post('/create-order', protect, createRazorpayOrder);
router.post('/verify-payment', protect, processPaymentVerification);
router.get('/receipt/:paymentId', protect, getReceipt);

module.exports = router;
