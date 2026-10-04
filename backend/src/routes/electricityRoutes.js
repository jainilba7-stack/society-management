const express = require('express');
const router = express.Router();
const {
  createElectricityBill,
  getElectricityBills,
  updateElectricityBillStatus,
} = require('../controllers/electricityController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.post('/', protect, authorize('admin', 'secretary'), createElectricityBill);
router.get('/', protect, getElectricityBills);
router.put('/:id/status', protect, authorize('admin', 'secretary'), updateElectricityBillStatus);

module.exports = router;
