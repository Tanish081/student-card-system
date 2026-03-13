import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema(
  {
    schoolId: {
      type: String,
      default: process.env.DEFAULT_SCHOOL_ID || 'SCH001',
      index: true
    },
    classRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    label: {
      type: String,
      default: null,
      trim: true
    }
  },
  { timestamps: true }
);

sectionSchema.index({ schoolId: 1, classRef: 1, name: 1 }, { unique: true });

const Section = mongoose.model('Section', sectionSchema);

export default Section;
