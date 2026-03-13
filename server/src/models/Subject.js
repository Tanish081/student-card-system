import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    schoolId: {
      type: String,
      default: process.env.DEFAULT_SCHOOL_ID || 'SCH001',
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      default: null,
      trim: true
    }
  },
  { timestamps: true }
);

subjectSchema.index({ schoolId: 1, name: 1 }, { unique: true });

const Subject = mongoose.model('Subject', subjectSchema);

export default Subject;
