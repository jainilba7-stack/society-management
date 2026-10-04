const mongoose = require('mongoose');
const ElectricityBill = require('../models/ElectricityBill');
const Block = require('../models/Block');
const ActivityLog = require('../models/ActivityLog');

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

const createElectricityBill = async (req, res, next) => {
  try {
    const { month, year, blockId, block, amount, dueDate, description } = req.body;
    const inputBlock = blockId || block;

    if (!inputBlock) {
      return res.status(400).json({ success: false, message: 'Please specify the block (e.g. A or Block A)' });
    }

    const resolvedBlock = await resolveBlock(inputBlock);
    if (!resolvedBlock) {
      return res.status(404).json({ success: false, message: `Block '${inputBlock}' not found` });
    }

    const bill = await ElectricityBill.create({
      month,
      year: parseInt(year),
      block: resolvedBlock._id,
      amount: parseFloat(amount),
      dueDate: new Date(dueDate),
      description: description || 'Common Area & Block Light Bill',
    });

    await ActivityLog.create({
      action: 'Added Electricity Bill',
      user: req.user._id,
      userRole: req.user.role,
      details: `Added electricity bill of ₹${amount} for ${resolvedBlock.name} (${month} ${year})`,
    });

    res.status(201).json({ success: true, message: 'Electricity bill added successfully', bill });
  } catch (error) {
    next(error);
  }
};

const getElectricityBills = async (req, res, next) => {
  try {
    const { blockId, block } = req.query;
    let query = {};
    const inputBlock = blockId || block;

    // Block scope check
    if (req.user.role === 'secretary') {
      if (req.user.block) query.block = req.user.block;
    } else if (req.user.role === 'resident') {
      if (req.user.block) query.block = req.user.block;
    } else if (inputBlock) {
      const resolved = await resolveBlock(inputBlock);
      if (resolved) query.block = resolved._id;
    }

    const bills = await ElectricityBill.find(query).populate('block', 'name').sort('-createdAt');
    res.status(200).json({ success: true, count: bills.length, bills });
  } catch (error) {
    next(error);
  }
};

const updateElectricityBillStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const bill = await ElectricityBill.findById(id).populate('block');
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Electricity bill not found' });
    }

    // Scope check for block secretary
    if (req.user.role === 'secretary' && req.user.block && req.user.block.toString() !== bill.block._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied: Cannot edit another block electricity bill' });
    }

    bill.status = status;
    await bill.save();

    res.status(200).json({ success: true, message: 'Electricity bill status updated', bill });
  } catch (error) {
    next(error);
  }
};

module.exports = { createElectricityBill, getElectricityBills, updateElectricityBillStatus };
