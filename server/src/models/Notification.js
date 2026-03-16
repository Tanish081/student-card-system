import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    schoolId: {
      type: String,
      default: process.env.DEFAULT_SCHOOL_ID || 'SCH001',
      index: true
    },
    studentUID: {
      type: String,
      required: true,
      index: true
    },
    type: {
      type: String,
      required: true,
      trim: true,
      default: 'general'
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    entityType: {
      type: String,
      default: null,
      trim: true
    },
    entityId: {
      type: String,
      default: null,
      trim: true
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  { timestamps: true }
);

notificationSchema.index({ schoolId: 1, studentUID: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
