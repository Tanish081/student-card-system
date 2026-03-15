import mongoose from 'mongoose';

const EVENT_TYPES = ['competition', 'workshop', 'sports', 'scholarship', 'training'];
const CATEGORIES = [
  'science',
  'technology',
  'sports',
  'arts',
  'mathematics',
  'debate',
  'robotics',
  'music'
];
const STATUSES = ['active', 'expired'];

const attachmentSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
      trim: true
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    fileUrl: {
      type: String,
      default: null,
      trim: true
    },
    dataUrl: {
      type: String,
      default: null
    },
    sizeKB: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { _id: false }
);

const normalizeArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const opportunitySchema = new mongoose.Schema(
  {
    schoolId: {
      type: String,
      default: process.env.DEFAULT_SCHOOL_ID || 'SCH001',
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    eventType: {
      type: String,
      enum: EVENT_TYPES,
      required: true,
      lowercase: true,
      trim: true
    },
    category: {
      type: String,
      enum: CATEGORIES,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    skillTags: {
      type: [String],
      default: [],
      set: normalizeArray
    },
    attachments: {
      type: [attachmentSchema],
      default: []
    },
    eligibleClasses: {
      type: [String],
      required: true,
      set: normalizeArray,
      index: true
    },
    minSPI: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    postedByName: {
      type: String,
      default: null,
      trim: true
    },
    role: {
      type: String,
      required: true,
      trim: true
    },
    deadline: {
      type: Date,
      required: true,
      index: true,
      validate: {
        validator(value) {
          if (!value) return false;
          return value.getTime() > Date.now();
        },
        message: 'deadline must be a future date'
      }
    },
    status: {
      type: String,
      enum: STATUSES,
      default: 'active',
      index: true
    }
  },
  { timestamps: true }
);

opportunitySchema.index({ schoolId: 1, deadline: 1 });
opportunitySchema.index({ schoolId: 1, eligibleClasses: 1, category: 1 });
opportunitySchema.index({ schoolId: 1, status: 1, deadline: 1 });

opportunitySchema.pre('save', function syncStatus(next) {
  if (this.deadline && this.deadline.getTime() < Date.now()) {
    this.status = 'expired';
  }

  this.skillTags = normalizeArray(this.skillTags).map((item) => String(item).toLowerCase());
  this.eligibleClasses = normalizeArray(this.eligibleClasses).map((item) => String(item).toUpperCase());

  next();
});

const Opportunity = mongoose.model('Opportunity', opportunitySchema);

export { EVENT_TYPES, CATEGORIES, STATUSES };
export default Opportunity;
