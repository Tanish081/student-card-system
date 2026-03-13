import mongoose from 'mongoose';

const schemeSchema = new mongoose.Schema(
  {
    schoolId: {
      type: String,
      default: process.env.DEFAULT_SCHOOL_ID || 'SCH001',
      index: true
    },
    schemeName: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    minAcademicScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    minSPI: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    maxFamilyIncome: {
      type: Number,
      default: null
    },
    eligibleClasses: {
      type: [String],
      default: []
    },
    sportsRequired: {
      type: Boolean,
      default: false
    },
    activityRequired: {
      type: Boolean,
      default: false
    },
    active: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  { timestamps: true }
);

schemeSchema.index({ schoolId: 1, schemeName: 1 }, { unique: true });

const Scheme = mongoose.model('Scheme', schemeSchema);

export default Scheme;
