const express = require('express');
const router = express.Router();
const { createAnnouncement, forwardAnnouncement, getAnnouncements } = require('../controllers/announcementController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.get('/', protect, getAnnouncements);
router.post('/', protect, authorize('admin', 'secretary'), createAnnouncement);
router.post('/:id/forward', protect, authorize('secretary'), forwardAnnouncement);

module.exports = router;
