import mongoose from 'mongoose';

const academicRecordSchema = new mongoose.Schema(
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
    subject: {
      type: String,
      required: true,
      trim: true
    },
    subjectRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      default: null
    },
    marks: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    examType: {
      type: String,
      required: true,
      trim: true
    },
    teacherID: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

const AcademicRecord = mongoose.model('AcademicRecord', academicRecordSchema);

export default AcademicRecord;
