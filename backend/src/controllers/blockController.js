const Block = require('../models/Block');
const User = require('../models/User');
const Flat = require('../models/Flat');
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');
const ActivityLog = require('../models/ActivityLog');

const getAllBlocks = async (req, res, next) => {
  try {
    let query = {};

    // Scope check: If secretary or resident, restrict if requested outside scope
    if (req.user.role === 'secretary') {
      if (req.user.block) {
        query._id = req.user.block;
      }
    } else if (req.user.role === 'resident') {
      if (req.user.block) {
        query._id = req.user.block;
      }
    }

    const blocks = await Block.find(query).populate('secretary', 'fullName email phone');

    // Attach calculated stats for each block
    const blocksWithStats = await Promise.all(
      blocks.map(async (b) => {
        const totalFlats = await Flat.countDocuments({ block: b._id });
        const totalResidents = await User.countDocuments({ block: b._id, role: 'resident' });
        const paidCount = await Flat.countDocuments({ block: b._id, maintenanceStatus: 'paid' });
        const pendingCount = await Flat.countDocuments({ block: b._id, maintenanceStatus: { $ne: 'paid' } });

        const bObj = b.toObject();
        bObj.totalFlats = totalFlats;
        bObj.totalResidents = totalResidents;
        bObj.paidFlatsCount = paidCount;
        bObj.pendingFlatsCount = pendingCount;
        return bObj;
      })
    );

    res.status(200).json({ success: true, count: blocksWithStats.length, blocks: blocksWithStats });
  } catch (error) {
    next(error);
  }
};

const getBlockById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Scope enforcement for block secretary
    if (req.user.role === 'secretary' && req.user.block && req.user.block.toString() !== id) {
      return res.status(403).json({ success: false, message: 'Access denied: Cannot view another block' });
    }

    const block = await Block.findById(id).populate('secretary', 'fullName email phone');
    if (!block) {
      return res.status(404).json({ success: false, message: 'Block not found' });
    }

    const flats = await Flat.find({ block: id }).populate('resident', 'fullName email phone');
    const residents = await User.find({ block: id, role: 'resident' });
    const complaints = await Complaint.find({ block: id }).sort('-createdAt').limit(10);
    const payments = await Payment.find({ block: id }).populate('resident', 'fullName').populate('flat').sort('-createdAt').limit(10);

    const paidCount = flats.filter((f) => f.maintenanceStatus === 'paid').length;
    const pendingCount = flats.filter((f) => f.maintenanceStatus !== 'paid').length;

    res.status(200).json({
      success: true,
      block,
      stats: {
        totalFlats: flats.length,
        totalResidents: residents.length,
        paidFlats: paidCount,
        pendingFlats: pendingCount,
      },
      flats,
      residents,
      recentComplaints: complaints,
      recentPayments: payments,
    });
  } catch (error) {
    next(error);
  }
};

const createBlock = async (req, res, next) => {
  try {
    const { name, totalFlatsCount, description } = req.body;

    const existing = await Block.findOne({ name });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Block with this name already exists' });
    }

    const block = await Block.create({ name, totalFlatsCount: totalFlatsCount || 0, description });

    await ActivityLog.create({
      action: 'Created Block',
      user: req.user._id,
      userRole: req.user.role,
      details: `Created new block: ${name}`,
    });

    res.status(201).json({ success: true, message: 'Block created successfully', block });
  } catch (error) {
    next(error);
  }
};

const updateBlock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, totalFlatsCount, description } = req.body;

    const block = await Block.findById(id);
    if (!block) {
      return res.status(404).json({ success: false, message: 'Block not found' });
    }

    if (name) block.name = name;
    if (totalFlatsCount !== undefined) block.totalFlatsCount = totalFlatsCount;
    if (description !== undefined) block.description = description;

    await block.save();

    await ActivityLog.create({
      action: 'Updated Block',
      user: req.user._id,
      userRole: req.user.role,
      details: `Updated block details: ${block.name}`,
    });

    res.status(200).json({ success: true, message: 'Block updated successfully', block });
  } catch (error) {
    next(error);
  }
};

const assignSecretary = async (req, res, next) => {
  try {
    const { id } = req.params; // block ID
    const { secretaryId } = req.body;

    const block = await Block.findById(id);
    if (!block) {
      return res.status(404).json({ success: false, message: 'Block not found' });
    }

    const user = await User.findById(secretaryId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update user role to secretary and attach block
    user.role = 'secretary';
    user.block = block._id;
    await user.save();

    // Link block to secretary
    block.secretary = user._id;
    await block.save();

    await ActivityLog.create({
      action: 'Assigned Block Secretary',
      user: req.user._id,
      userRole: req.user.role,
      details: `Assigned ${user.fullName} as Secretary for ${block.name}`,
    });

    res.status(200).json({ success: true, message: `Assigned ${user.fullName} as secretary for ${block.name}`, block });
  } catch (error) {
    next(error);
  }
};

const deleteBlock = async (req, res, next) => {
  try {
    const { id } = req.params;

    const block = await Block.findById(id);
    if (!block) {
      return res.status(404).json({ success: false, message: 'Block not found' });
    }

    await Block.findByIdAndDelete(id);

    await ActivityLog.create({
      action: 'Deleted Block',
      user: req.user._id,
      userRole: req.user.role,
      details: `Deleted block: ${block.name}`,
    });

    res.status(200).json({ success: true, message: 'Block deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllBlocks, getBlockById, createBlock, updateBlock, assignSecretary, deleteBlock };
