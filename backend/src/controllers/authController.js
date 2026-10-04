const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Block = require('../models/Block');
const Flat = require('../models/Flat');
const ActivityLog = require('../models/ActivityLog');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const register = async (req, res, next) => {
  try {
    const { fullName, email, password, phone, blockId, block, flatNumber, familyMemberCount } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const inputBlock = blockId || block;

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let assignedBlock = null;
    let assignedFlat = null;

    if (inputBlock && inputBlock.trim()) {
      if (mongoose.Types.ObjectId.isValid(inputBlock)) {
        assignedBlock = await Block.findById(inputBlock);
      } else {
        // Handle input like "a", "A", "Block A"
        let cleanName = inputBlock.trim();
        if (cleanName.length === 1) {
          cleanName = `Block ${cleanName.toUpperCase()}`;
        } else if (!cleanName.toLowerCase().startsWith('block')) {
          cleanName = `Block ${cleanName}`;
        }
        assignedBlock = await Block.findOne({ name: { $regex: new RegExp(`^${cleanName}$`, 'i') } });

        // Fallback search
        if (!assignedBlock) {
          assignedBlock = await Block.findOne({ name: { $regex: new RegExp(inputBlock.trim(), 'i') } });
        }
      }
    }

    if (assignedBlock && flatNumber) {
      assignedFlat = await Flat.findOne({ block: assignedBlock._id, flatNumber: { $regex: new RegExp(`^${flatNumber.trim()}$`, 'i') } });
    }

    const user = await User.create({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone || '',
      role: 'resident',
      block: assignedBlock ? assignedBlock._id : null,
      flat: assignedFlat ? assignedFlat._id : null,
      flatNumber: flatNumber ? flatNumber.toUpperCase().trim() : '',
      familyMemberCount: familyMemberCount || 1,
    });

    if (assignedFlat) {
      assignedFlat.resident = user._id;
      assignedFlat.ownerName = user.fullName;
      assignedFlat.phone = user.phone;
      assignedFlat.email = user.email;
      assignedFlat.occupancyStatus = 'occupied';
      await assignedFlat.save();
    }

    await ActivityLog.create({
      action: 'Resident Registered',
      user: user._id,
      userRole: 'resident',
      details: `${user.fullName} registered for ${assignedBlock ? assignedBlock.name : ''} Flat ${user.flatNumber || 'N/A'}`,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        block: assignedBlock ? assignedBlock._id : null,
        blockName: assignedBlock ? assignedBlock.name : null,
        flatNumber: user.flatNumber,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password').populate('block').populate('flat');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (user.accountStatus === 'inactive') {
      return res.status(403).json({ success: false, message: 'Your account is deactivated' });
    }

    const token = generateToken(user._id);

    await ActivityLog.create({
      action: 'User Logged In',
      user: user._id,
      userRole: user.role,
      details: `${user.fullName} logged in successfully`,
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        block: user.block ? user.block : null,
        blockName: user.block ? user.block.name : null,
        flat: user.flat ? user.flat : null,
        flatNumber: user.flatNumber,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('block').populate('flat');
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { fullName, phone, familyMemberCount, profileImage } = req.body;

    const user = await User.findById(req.user._id);

    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;
    if (familyMemberCount) user.familyMemberCount = familyMemberCount;
    if (profileImage) user.profileImage = profileImage;

    await user.save();

    res.status(200).json({ success: true, message: 'Profile updated successfully', user });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please enter current and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword };
