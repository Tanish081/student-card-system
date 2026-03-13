import mongoose from 'mongoose';

const guidanceSchema = new mongoose.Schema(
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
    message: {
      type: String,
      required: true,
      trim: true
    },
    addedByTeacherID: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

const Guidance = mongoose.model('Guidance', guidanceSchema);

export default Guidance;
