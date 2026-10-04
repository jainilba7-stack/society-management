const express = require('express');
const router = express.Router();
const { getDashboardStats, getReports } = require('../controllers/reportController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.get('/stats', protect, getDashboardStats);
router.get('/reports', protect, authorize('admin', 'secretary'), getReports);

module.exports = router;
