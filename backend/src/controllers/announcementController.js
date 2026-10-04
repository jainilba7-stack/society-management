const Announcement = require('../models/Announcement');
const User = require('../models/User');
const Block = require('../models/Block');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');

const createAnnouncement = async (req, res, next) => {
  try {
    const { title, description, scope, targetBlockIds, priority } = req.body;

    let targetBlocks = [];
    if (scope === 'block' && targetBlockIds && targetBlockIds.length > 0) {
      targetBlocks = targetBlockIds;
    } else if (req.user.role === 'secretary') {
      // Secretary can only create for their assigned block
      if (!req.user.block) {
        return res.status(403).json({ success: false, message: 'You are not assigned to a block' });
      }
      targetBlocks = [req.user.block];
    }

    const announcement = await Announcement.create({
      title,
      description,
      createdBy: req.user._id,
      scope: req.user.role === 'admin' ? scope || 'society' : 'block',
      targetBlocks,
      priority: priority || 'normal',
    });

    // Notify target audience
    let userFilter = { accountStatus: 'active' };
    if (scope === 'block' && targetBlocks.length > 0) {
      userFilter.block = { $in: targetBlocks };
    }

    const usersToNotify = await User.find(userFilter);
    for (let u of usersToNotify) {
      await Notification.create({
        recipient: u._id,
        title: `📢 Announcement: ${title}`,
        message: description.length > 100 ? description.substring(0, 100) + '...' : description,
        type: 'announcement',
      });
    }

    await ActivityLog.create({
      action: 'Created Announcement',
      user: req.user._id,
      userRole: req.user.role,
      details: `Created ${scope} announcement: ${title}`,
    });

    res.status(201).json({ success: true, message: 'Announcement created successfully', announcement });
  } catch (error) {
    next(error);
  }
};

const forwardAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params; // announcement ID

    if (req.user.role !== 'secretary') {
      return res.status(403).json({ success: false, message: 'Only Block Secretaries can forward announcements' });
    }

    const originalAnnouncement = await Announcement.findById(id);
    if (!originalAnnouncement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    if (!req.user.block) {
      return res.status(403).json({ success: false, message: 'You have no assigned block' });
    }

    const blockDoc = await Block.findById(req.user.block);

    const forwarded = await Announcement.create({
      title: `[Block ${blockDoc ? blockDoc.name : ''} Notice] ${originalAnnouncement.title}`,
      description: originalAnnouncement.description,
      createdBy: originalAnnouncement.createdBy,
      scope: 'block',
      targetBlocks: [req.user.block],
      priority: originalAnnouncement.priority,
      isForwarded: true,
      forwardedBy: req.user._id,
    });

    // Notify block residents
    const blockResidents = await User.find({ block: req.user.block, accountStatus: 'active' });
    for (let resUser of blockResidents) {
      await Notification.create({
        recipient: resUser._id,
        title: `🔔 Forwarded Notice: ${originalAnnouncement.title}`,
        message: originalAnnouncement.description.substring(0, 120),
        type: 'announcement',
      });
    }

    await ActivityLog.create({
      action: 'Forwarded Announcement',
      user: req.user._id,
      userRole: req.user.role,
      details: `Forwarded announcement "${originalAnnouncement.title}" to ${blockDoc ? blockDoc.name : 'assigned block'}`,
    });

    res.status(200).json({ success: true, message: 'Announcement forwarded to your block residents', announcement: forwarded });
  } catch (error) {
    next(error);
  }
};

const getAnnouncements = async (req, res, next) => {
  try {
    let query = { status: 'active' };

    if (req.user.role === 'secretary') {
      query.$or = [
        { scope: 'society' },
        { targetBlocks: req.user.block },
        { forwardedBy: req.user._id },
      ];
    } else if (req.user.role === 'resident') {
      query.$or = [
        { scope: 'society' },
        { targetBlocks: req.user.block },
      ];
    }

    const announcements = await Announcement.find(query)
      .populate('createdBy', 'fullName role')
      .populate('targetBlocks', 'name')
      .populate('forwardedBy', 'fullName')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: announcements.length, announcements });
  } catch (error) {
    next(error);
  }
};

module.exports = { createAnnouncement, forwardAnnouncement, getAnnouncements };
