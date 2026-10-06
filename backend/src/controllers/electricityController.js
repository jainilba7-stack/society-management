const mongoose = require('mongoose');
const ElectricityBill = require('../models/ElectricityBill');
const Block = require('../models/Block');
const Flat = require('../models/Flat');
const User = require('../models/User');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const { uploadImageToCloudinary } = require('../services/cloudinaryService');

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
    const { month, year, blockId, block, flatNumber, unitsConsumed, meterReading, amount, dueDate, description } = req.body;
    const inputBlock = blockId || block;

    if (!flatNumber || !flatNumber.trim()) {
      return res.status(400).json({ success: false, message: 'Please specify the Flat Number (e.g. A-101)' });
    }

    // Find Flat
    const flatDoc = await Flat.findOne({
      flatNumber: { $regex: new RegExp(`^${flatNumber.trim()}$`, 'i') },
    }).populate('block').populate('resident');

    if (!flatDoc) {
      return res.status(404).json({ success: false, message: `Flat '${flatNumber}' not found in society` });
    }

    let billImageUrl = '';
    if (req.file) {
      billImageUrl = await uploadImageToCloudinary(req.file.buffer, 'society_electricity_bills');
    }

    const bill = await ElectricityBill.create({
      month,
      year: parseInt(year),
      block: flatDoc.block._id,
      flat: flatDoc._id,
      flatNumber: flatDoc.flatNumber,
      resident: flatDoc.resident ? flatDoc.resident._id : null,
      unitsConsumed: unitsConsumed ? parseFloat(unitsConsumed) : 0,
      meterReading: meterReading || '',
      amount: parseFloat(amount),
      dueDate: new Date(dueDate),
      description: description || `Electricity bill for Flat ${flatDoc.flatNumber}`,
      billImageUrl,
    });

    if (flatDoc.resident) {
      await Notification.create({
        recipient: flatDoc.resident._id,
        title: `⚡ Electricity Bill Issued for Flat ${flatDoc.flatNumber}`,
        message: `Electricity bill of ₹${amount} (${unitsConsumed || 0} kWh) for ${month} ${year} has been issued to your flat. Due Date: ${new Date(dueDate).toLocaleDateString()}`,
        type: 'bill',
      });
    }

    await ActivityLog.create({
      action: 'Added Flat Electricity Bill',
      user: req.user._id,
      userRole: req.user.role,
      details: `Issued electricity bill of ₹${amount} to Flat ${flatDoc.flatNumber} (${month} ${year})`,
    });

    res.status(201).json({
      success: true,
      message: `Electricity bill of ₹${amount} issued to Flat ${flatDoc.flatNumber}`,
      bill,
    });
  } catch (error) {
    next(error);
  }
};

const getElectricityBills = async (req, res, next) => {
  try {
    const { blockId, block, flatNumber } = req.query;
    let query = {};

    // Block scope check
    if (req.user.role === 'secretary') {
      if (req.user.block) query.block = req.user.block;
    } else if (req.user.role === 'resident') {
      if (req.user.flatNumber) query.flatNumber = req.user.flatNumber;
    } else {
      const inputBlock = blockId || block;
      if (inputBlock) {
        const resolved = await resolveBlock(inputBlock);
        if (resolved) query.block = resolved._id;
      }
      if (flatNumber) {
        query.flatNumber = { $regex: new RegExp(flatNumber.trim(), 'i') };
      }
    }

    const bills = await ElectricityBill.find(query)
      .populate('block', 'name')
      .populate('resident', 'fullName phone email')
      .populate('flat', 'flatNumber ownerName')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: bills.length, bills });
  } catch (error) {
    next(error);
  }
};

const updateElectricityBillStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const bill = await ElectricityBill.findById(id).populate('block').populate('resident');
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Electricity bill not found' });
    }

    // Scope check for block secretary
    if (req.user.role === 'secretary' && req.user.block && req.user.block.toString() !== bill.block._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied: Cannot edit another block electricity bill' });
    }

    bill.status = status;
    await bill.save();

    if (bill.resident) {
      await Notification.create({
        recipient: bill.resident._id,
        title: `⚡ Electricity Bill Status Updated`,
        message: `Your electricity bill of ₹${bill.amount} for Flat ${bill.flatNumber} has been marked as ${status.toUpperCase()}`,
        type: 'bill',
      });
    }

    res.status(200).json({ success: true, message: `Electricity bill status updated to ${status}`, bill });
  } catch (error) {
    next(error);
  }
};

module.exports = { createElectricityBill, getElectricityBills, updateElectricityBillStatus };
