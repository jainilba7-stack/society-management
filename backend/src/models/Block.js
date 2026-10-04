const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Block name is required'],
      unique: true,
      trim: true,
    },
    secretary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    totalFlatsCount: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Block', blockSchema);
