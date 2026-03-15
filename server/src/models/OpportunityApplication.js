import mongoose from 'mongoose';

const APPLICATION_STATUSES = ['applied', 'shortlisted', 'selected', 'rejected'];

const opportunityApplicationSchema = new mongoose.Schema(
  {
    schoolId: {
      type: String,
      default: process.env.DEFAULT_SCHOOL_ID || 'SCH001',
      index: true
    },
    opportunityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Opportunity',
      required: true,
      index: true
    },
    studentUID: {
      type: String,
      required: true,
      index: true
    },
    studentUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: 'applied',
      index: true
    },
    relevanceScoreSnapshot: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    successProbabilitySnapshot: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  { timestamps: true }
);

opportunityApplicationSchema.index(
  {
    schoolId: 1,
    opportunityId: 1,
    studentUID: 1
  },
  { unique: true }
);

const OpportunityApplication = mongoose.model('OpportunityApplication', opportunityApplicationSchema);

export { APPLICATION_STATUSES };
export default OpportunityApplication;
