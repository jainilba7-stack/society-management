const express = require('express');
const router = express.Router();
const {
  getAllBlocks,
  getBlockById,
  createBlock,
  updateBlock,
  assignSecretary,
  deleteBlock,
} = require('../controllers/blockController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.get('/', protect, getAllBlocks);
router.get('/:id', protect, getBlockById);
router.post('/', protect, authorize('admin'), createBlock);
router.put('/:id', protect, authorize('admin'), updateBlock);
router.put('/:id/assign-secretary', protect, authorize('admin'), assignSecretary);
router.delete('/:id', protect, authorize('admin'), deleteBlock);

module.exports = router;
