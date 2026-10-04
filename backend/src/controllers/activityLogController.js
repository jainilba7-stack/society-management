const ActivityLog = require('../models/ActivityLog');

const getActivityLogs = async (req, res, next) => {
  try {
    const logs = await ActivityLog.find()
      .populate('user', 'fullName email role')
      .sort('-createdAt')
      .limit(50);

    res.status(200).json({ success: true, count: logs.length, logs });
  } catch (error) {
    next(error);
  }
};

module.exports = { getActivityLogs };
