import mongoose from 'mongoose';
import { TEACHER_SUB_ROLES } from '../config/constants.js';

const teacherRoleSchema = new mongoose.Schema(
  {
    schoolId: {
      type: String,
      default: process.env.DEFAULT_SCHOOL_ID || 'SCH001',
      index: true
    },
    teacherID: {
      type: String,
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: Object.values(TEACHER_SUB_ROLES),
      required: true
    },
    class: {
      type: String,
      default: null,
      trim: true
    },
    classRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      default: null
    },
    sectionRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      default: null
    },
    subject: {
      type: String,
      default: null,
      trim: true
    },
    subjectRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      default: null
    }
  },
  { timestamps: true }
);

teacherRoleSchema.index({ schoolId: 1, teacherID: 1, role: 1, class: 1, subject: 1 }, { unique: true });

const TeacherRole = mongoose.model('TeacherRole', teacherRoleSchema);

export default TeacherRole;
