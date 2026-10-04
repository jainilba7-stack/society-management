const mongoose = require('mongoose');

const maintenanceBillSchema = new mongoose.Schema(
  {
    month: {
      type: String, // e.g. "October"
      required: true,
    },
    year: {
      type: Number, // e.g. 2026
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    lateFee: {
      type: Number,
      default: 100,
    },
    description: {
      type: String,
      default: 'Monthly Maintenance Charge',
    },
    targetBlocks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Block',
      },
    ],
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MaintenanceBill', maintenanceBillSchema);
