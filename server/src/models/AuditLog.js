import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    schoolId: {
      type: String,
      default: process.env.DEFAULT_SCHOOL_ID || 'SCH001',
      index: true
    },
    action: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    entityType: {
      type: String,
      required: true,
      trim: true
    },
    entityId: {
      type: String,
      required: true,
      trim: true
    },
    performedByUserId: {
      type: String,
      required: true
    },
    performedByRole: {
      type: String,
      required: true
    },
    performedByName: {
      type: String,
      required: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    beforeState: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    afterState: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    previousHash: {
      type: String,
      default: null,
      index: true
    },
    currentHash: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    eventTimestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  { timestamps: true }
);

auditLogSchema.index({ schoolId: 1, eventTimestamp: 1, _id: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
