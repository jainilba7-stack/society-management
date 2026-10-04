const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const { uploadImageToCloudinary } = require('../services/cloudinaryService');

const submitComplaint = async (req, res, next) => {
  try {
    const { title, description, category, priority } = req.body;

    if (!req.user.block || !req.user.flatNumber) {
      return res.status(400).json({ success: false, message: 'Your profile must have an assigned block and flat number to submit complaints' });
    }

    let imageUrl = '';
    if (req.file) {
      imageUrl = await uploadImageToCloudinary(req.file.buffer, 'society_complaints');
    }

    const complaint = await Complaint.create({
      title,
      description,
      category,
      block: req.user.block,
      flatNumber: req.user.flatNumber,
      resident: req.user._id,
      priority: priority || 'medium',
      imageUrl,
    });

    await ActivityLog.create({
      action: 'Submitted Complaint',
      user: req.user._id,
      userRole: req.user.role,
      details: `Filed complaint "${title}" [Category: ${category}]`,
    });

    // Notify Admin and Block Secretary
    const blockSecretaries = await User.find({ block: req.user.block, role: 'secretary' });
    for (let sec of blockSecretaries) {
      await Notification.create({
        recipient: sec._id,
        title: `🚨 New Complaint in Your Block: ${title}`,
        message: `Resident in Flat ${req.user.flatNumber} filed a complaint: ${title}`,
        type: 'complaint',
      });
    }

    res.status(201).json({ success: true, message: 'Complaint submitted successfully', complaint });
  } catch (error) {
    next(error);
  }
};

const getComplaints = async (req, res, next) => {
  try {
    const { category, status, priority, blockId, search } = req.query;
    let query = {};

    // Strict scope check
    if (req.user.role === 'secretary') {
      if (req.user.block) query.block = req.user.block;
    } else if (req.user.role === 'resident') {
      query.resident = req.user._id;
    } else if (blockId) {
      query.block = blockId;
    }

    if (category) query.category = category;
    if (status) query.status = status;
    if (priority) query.priority = priority;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { flatNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const complaints = await Complaint.find(query)
      .populate('resident', 'fullName phone email')
      .populate('block', 'name')
      .populate('resolvedBy', 'fullName role')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: complaints.length, complaints });
  } catch (error) {
    next(error);
  }
};

const updateComplaintStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, resolutionNote } = req.body;

    const complaint = await Complaint.findById(id).populate('block').populate('resident');
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Security scope check for Block Secretary
    if (req.user.role === 'secretary' && req.user.block && req.user.block.toString() !== complaint.block._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied: Cannot update complaint from another block' });
    }

    complaint.status = status;
    if (resolutionNote) complaint.resolutionNote = resolutionNote;
    if (status === 'Resolved' || status === 'Rejected') {
      complaint.resolvedBy = req.user._id;
    }

    await complaint.save();

    // Notify resident
    if (complaint.resident) {
      await Notification.create({
        recipient: complaint.resident._id,
        title: `🔔 Complaint Status Updated: ${complaint.title}`,
        message: `Your complaint status has been updated to "${status}". Note: ${resolutionNote || 'N/A'}`,
        type: 'complaint',
      });
    }

    await ActivityLog.create({
      action: 'Updated Complaint Status',
      user: req.user._id,
      userRole: req.user.role,
      details: `Updated complaint "${complaint.title}" to ${status}`,
    });

    res.status(200).json({ success: true, message: `Complaint status updated to ${status}`, complaint });
  } catch (error) {
    next(error);
  }
};

module.exports = { submitComplaint, getComplaints, updateComplaintStatus };
