const Block = require('../models/Block');

/**
 * Middleware ensuring a Block Secretary can only operate on their assigned block.
 * Main Admin passes through globally.
 */
const checkBlockAccess = async (req, res, next) => {
  if (req.user.role === 'admin') {
    return next();
  }

  if (req.user.role === 'secretary') {
    const targetBlockId = req.params.blockId || req.query.blockId || req.body.blockId || req.body.block;

    if (!req.user.block) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned as a secretary to any block',
      });
    }

    if (targetBlockId) {
      const userBlockIdStr = req.user.block.toString();
      const targetBlockIdStr = targetBlockId.toString();

      // If target parameter is a block ID or block name, resolve and check
      if (userBlockIdStr !== targetBlockIdStr) {
        // Also check if target is block name string
        const userBlockDoc = await Block.findById(req.user.block);
        if (userBlockDoc && userBlockDoc.name.toLowerCase() !== targetBlockIdStr.toLowerCase()) {
          return res.status(403).json({
            success: false,
            message: 'Access denied: You can only view or manage your assigned block',
          });
        }
      }
    } else {
      // Force scope to secretary's block
      req.scopedBlockId = req.user.block;
    }
    return next();
  }

  if (req.user.role === 'resident') {
    // Residents can only view their own block data
    const targetBlockId = req.params.blockId || req.query.blockId || req.body.blockId || req.body.block;
    if (targetBlockId && req.user.block && req.user.block.toString() !== targetBlockId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only view your own block information',
      });
    }
    req.scopedBlockId = req.user.block;
    return next();
  }

  return res.status(403).json({ success: false, message: 'Unauthorized access' });
};

module.exports = { checkBlockAccess };
