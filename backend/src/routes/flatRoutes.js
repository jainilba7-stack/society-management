const express = require('express');
const router = express.Router();
const { getAllFlats, createFlat, updateFlat, deleteFlat } = require('../controllers/flatController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.get('/', protect, getAllFlats);
router.post('/', protect, authorize('admin', 'secretary'), createFlat);
router.put('/:id', protect, authorize('admin', 'secretary'), updateFlat);
router.delete('/:id', protect, authorize('admin'), deleteFlat);

module.exports = router;
