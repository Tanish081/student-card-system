import mongoose from 'mongoose';

const classSchema = new mongoose.Schema(
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
    displayName: {
      type: String,
      default: null,
      trim: true
    }
  },
  { timestamps: true }
);

classSchema.index({ schoolId: 1, name: 1 }, { unique: true });

const SchoolClass = mongoose.model('Class', classSchema);

export default SchoolClass;
