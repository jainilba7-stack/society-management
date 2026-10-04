const User = require('../models/User');
const Flat = require('../models/Flat');
const ActivityLog = require('../models/ActivityLog');

const getAllResidents = async (req, res, next) => {
  try {
    const { blockId, search, status } = req.query;
    let query = { role: { $in: ['resident', 'secretary'] } };

    // Strict Scope check: Block Secretary MUST NOT be able to view another block's residents!
    if (req.user.role === 'secretary') {
      if (req.user.block) {
        query.block = req.user.block;
      }
    } else if (req.user.role === 'resident') {
      if (req.user.block) {
        query.block = req.user.block;
      }
    } else if (blockId) {
      query.block = blockId;
    }

    if (status) {
      query.accountStatus = status;
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { flatNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const residents = await User.find(query).select('-password').populate('block', 'name').populate('flat');
    res.status(200).json({ success: true, count: residents.length, residents });
  } catch (error) {
    next(error);
  }
};

const getResidentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const resident = await User.findById(id).select('-password').populate('block').populate('flat');

    if (!resident) {
      return res.status(404).json({ success: false, message: 'Resident not found' });
    }

    // Security check: Block secretary scope check
    if (req.user.role === 'secretary' && req.user.block && resident.block && req.user.block.toString() !== resident.block._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied: Cannot view resident from another block' });
    }

    // Resident scope check: Resident can only view their own profile
    if (req.user.role === 'resident' && req.user._id.toString() !== resident._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied: Cannot view another resident profile' });
    }

    res.status(200).json({ success: true, resident });
  } catch (error) {
    next(error);
  }
};

const updateResident = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fullName, phone, accountStatus, familyMemberCount, role, blockId, flatNumber } = req.body;

    const resident = await User.findById(id);
    if (!resident) {
      return res.status(404).json({ success: false, message: 'Resident not found' });
    }

    if (fullName) resident.fullName = fullName;
    if (phone) resident.phone = phone;
    if (accountStatus) resident.accountStatus = accountStatus;
    if (familyMemberCount) resident.familyMemberCount = familyMemberCount;
    if (role && req.user.role === 'admin') resident.role = role;
    if (blockId && req.user.role === 'admin') resident.block = blockId;
    if (flatNumber) resident.flatNumber = flatNumber;

    await resident.save();

    await ActivityLog.create({
      action: 'Updated Resident Info',
      user: req.user._id,
      userRole: req.user.role,
      details: `Updated info for ${resident.fullName}`,
    });

    res.status(200).json({ success: true, message: 'Resident updated successfully', resident });
  } catch (error) {
    next(error);
  }
};

const deleteResident = async (req, res, next) => {
  try {
    const { id } = req.params;

    const resident = await User.findById(id);
    if (!resident) {
      return res.status(404).json({ success: false, message: 'Resident not found' });
    }

    // Unlink from flat
    if (resident.flat) {
      await Flat.findByIdAndUpdate(resident.flat, { resident: null, occupancyStatus: 'vacant' });
    }

    await User.findByIdAndDelete(id);

    await ActivityLog.create({
      action: 'Removed Resident',
      user: req.user._id,
      userRole: req.user.role,
      details: `Removed resident ${resident.fullName}`,
    });

    res.status(200).json({ success: true, message: 'Resident removed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllResidents, getResidentById, updateResident, deleteResident };
