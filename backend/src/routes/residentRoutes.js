const express = require('express');
const router = express.Router();
const { getAllResidents, getResidentById, updateResident, deleteResident } = require('../controllers/residentController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.get('/', protect, getAllResidents);
router.get('/:id', protect, getResidentById);
router.put('/:id', protect, authorize('admin', 'secretary'), updateResident);
router.delete('/:id', protect, authorize('admin'), deleteResident);

module.exports = router;
