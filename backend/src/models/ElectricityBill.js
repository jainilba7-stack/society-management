const mongoose = require('mongoose');

const electricityBillSchema = new mongoose.Schema(
  {
    month: {
      type: String,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    block: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Block',
      required: true,
    },
    flat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flat',
      default: null,
    },
    flatNumber: {
      type: String,
      required: [true, 'Flat number is required for electricity bill'],
    },
    resident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    unitsConsumed: {
      type: Number,
      default: 0,
    },
    meterReading: {
      type: String,
      default: '',
    },
    amount: {
      type: Number,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      default: 'Flat Electricity & Meter Bill',
    },
    billImageUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['paid', 'pending', 'overdue'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ElectricityBill', electricityBillSchema);
