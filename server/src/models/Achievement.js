import mongoose from 'mongoose';
import { ACHIEVEMENT_STATUS } from '../config/constants.js';

const achievementSchema = new mongoose.Schema(
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
    eventName: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    level: {
      type: String,
      required: true,
      trim: true
    },
    position: {
      type: String,
      required: true,
      trim: true
    },
    points: {
      type: Number,
      required: true
    },
    certificateURL: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: Object.values(ACHIEVEMENT_STATUS),
      default: ACHIEVEMENT_STATUS.PENDING
    },
    enteredBy: {
      type: String,
      required: true
    },
    verifiedBy: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

const Achievement = mongoose.model('Achievement', achievementSchema);

export default Achievement;
