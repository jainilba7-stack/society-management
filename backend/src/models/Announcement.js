const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    scope: {
      type: String,
      enum: ['society', 'block'],
      default: 'society',
    },
    targetBlocks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Block',
      },
    ],
    priority: {
      type: String,
      enum: ['normal', 'urgent', 'high'],
      default: 'normal',
    },
    isForwarded: {
      type: Boolean,
      default: false,
    },
    forwardedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Announcement', announcementSchema);
