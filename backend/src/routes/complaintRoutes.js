const express = require('express');
const router = express.Router();
const { submitComplaint, getComplaints, updateComplaintStatus } = require('../controllers/complaintController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.get('/', protect, getComplaints);
router.post('/', protect, upload.single('image'), submitComplaint);
router.put('/:id/status', protect, authorize('admin', 'secretary'), updateComplaintStatus);

module.exports = router;
