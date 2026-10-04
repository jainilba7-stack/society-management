const mongoose = require('mongoose');

const flatSchema = new mongoose.Schema(
  {
    flatNumber: {
      type: String,
      required: [true, 'Flat number is required'],
      trim: true,
    },
    block: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Block',
      required: true,
    },
    resident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    ownerName: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      default: '',
    },
    familyMembers: {
      type: Number,
      default: 1,
    },
    occupancyStatus: {
      type: String,
      enum: ['occupied', 'vacant', 'rented'],
      default: 'occupied',
    },
    maintenanceStatus: {
      type: String,
      enum: ['paid', 'pending', 'overdue'],
      default: 'paid',
    },
  },
  { timestamps: true }
);

flatSchema.index({ flatNumber: 1, block: 1 }, { unique: true });

module.exports = mongoose.model('Flat', flatSchema);
