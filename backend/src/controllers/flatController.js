const mongoose = require('mongoose');
const Flat = require('../models/Flat');
const Block = require('../models/Block');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

// Helper to resolve block ID from ObjectId, letter 'A', 'a', or 'Block A'
const resolveBlock = async (input) => {
  if (!input) return null;
  if (mongoose.Types.ObjectId.isValid(input)) {
    const b = await Block.findById(input);
    if (b) return b;
  }
  let cleanName = input.toString().trim();
  if (cleanName.length === 1) {
    cleanName = `Block ${cleanName.toUpperCase()}`;
  } else if (!cleanName.toLowerCase().startsWith('block')) {
    cleanName = `Block ${cleanName}`;
  }
  let found = await Block.findOne({ name: { $regex: new RegExp(`^${cleanName}$`, 'i') } });
  if (found) return found;

  return await Block.findOne({ name: { $regex: new RegExp(input.toString().trim(), 'i') } });
};

const getAllFlats = async (req, res, next) => {
  try {
    const { blockId, block, occupancyStatus, search } = req.query;
    let query = {};

    const inputBlock = blockId || block;

    // Scope check: If Block Secretary, strictly filter by assigned block
    if (req.user.role === 'secretary') {
      if (req.user.block) {
        query.block = req.user.block;
      }
    } else if (req.user.role === 'resident') {
      if (req.user.block) {
        query.block = req.user.block;
      }
    } else if (inputBlock) {
      const resolved = await resolveBlock(inputBlock);
      if (resolved) {
        query.block = resolved._id;
      }
    }

    if (occupancyStatus) {
      query.occupancyStatus = occupancyStatus;
    }

    if (search) {
      query.$or = [
        { flatNumber: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const flats = await Flat.find(query).populate('block', 'name').populate('resident', 'fullName email phone');
    res.status(200).json({ success: true, count: flats.length, flats });
  } catch (error) {
    next(error);
  }
};

const createFlat = async (req, res, next) => {
  try {
    const { flatNumber, blockId, block, ownerName, phone, email, familyMembers, occupancyStatus } = req.body;
    const inputBlock = blockId || block;

    if (!inputBlock) {
      return res.status(400).json({ success: false, message: 'Please specify the block (e.g. A or Block A)' });
    }

    const resolvedBlock = await resolveBlock(inputBlock);
    if (!resolvedBlock) {
      return res.status(404).json({ success: false, message: `Block '${inputBlock}' not found in society` });
    }

    const existing = await Flat.findOne({
      flatNumber: { $regex: new RegExp(`^${flatNumber.trim()}$`, 'i') },
      block: resolvedBlock._id,
    });
    if (existing) {
      return res.status(400).json({ success: false, message: `Flat ${flatNumber} already exists in ${resolvedBlock.name}` });
    }

    const flat = await Flat.create({
      flatNumber: flatNumber.toUpperCase().trim(),
      block: resolvedBlock._id,
      ownerName: ownerName || '',
      phone: phone || '',
      email: email || '',
      familyMembers: familyMembers || 1,
      occupancyStatus: occupancyStatus || 'occupied',
    });

    await ActivityLog.create({
      action: 'Created Flat',
      user: req.user._id,
      userRole: req.user.role,
      details: `Created flat ${flatNumber} in ${resolvedBlock.name}`,
    });

    res.status(201).json({ success: true, message: 'Flat created successfully', flat });
  } catch (error) {
    next(error);
  }
};

const updateFlat = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { ownerName, phone, email, familyMembers, occupancyStatus, maintenanceStatus, residentId } = req.body;

    const flat = await Flat.findById(id).populate('block');
    if (!flat) {
      return res.status(404).json({ success: false, message: 'Flat not found' });
    }

    // Block Secretary scope check
    if (req.user.role === 'secretary' && req.user.block && req.user.block.toString() !== flat.block._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied: Cannot edit flat in another block' });
    }

    if (ownerName !== undefined) flat.ownerName = ownerName;
    if (phone !== undefined) flat.phone = phone;
    if (email !== undefined) flat.email = email;
    if (familyMembers !== undefined) flat.familyMembers = familyMembers;
    if (occupancyStatus !== undefined) flat.occupancyStatus = occupancyStatus;
    if (maintenanceStatus !== undefined) flat.maintenanceStatus = maintenanceStatus;

    if (residentId) {
      const user = await User.findById(residentId);
      if (user) {
        flat.resident = user._id;
        user.flat = flat._id;
        user.flatNumber = flat.flatNumber;
        user.block = flat.block._id;
        await user.save();
      }
    }

    await flat.save();

    res.status(200).json({ success: true, message: 'Flat updated successfully', flat });
  } catch (error) {
    next(error);
  }
};

const deleteFlat = async (req, res, next) => {
  try {
    const { id } = req.params;

    const flat = await Flat.findById(id);
    if (!flat) {
      return res.status(404).json({ success: false, message: 'Flat not found' });
    }

    await Flat.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: 'Flat removed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllFlats, createFlat, updateFlat, deleteFlat };
