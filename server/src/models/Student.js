import mongoose from 'mongoose';
import { generateStudentUID } from '../services/uidService.js';

const studentSchema = new mongoose.Schema(
  {
    schoolId: {
      type: String,
      default: process.env.DEFAULT_SCHOOL_ID || 'SCH001',
      index: true
    },
    uid: {
      type: String,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    dob: {
      type: Date,
      required: true
    },
    fullName: {
      type: String,
      default: null,
      trim: true
    },
    gender: {
      type: String,
      default: null,
      trim: true
    },
    dateOfBirth: {
      type: Date,
      default: null
    },
    address: {
      type: String,
      default: null,
      trim: true
    },
    city: {
      type: String,
      default: null,
      trim: true
    },
    state: {
      type: String,
      default: null,
      trim: true
    },
    pincode: {
      type: String,
      default: null,
      trim: true
    },
    parentName: {
      type: String,
      default: null,
      trim: true
    },
    parentContact: {
      type: String,
      default: null,
      trim: true
    },
    familyIncome: {
      type: Number,
      default: null
    },
    category: {
      type: String,
      default: null,
      trim: true
    },
    interests: {
      type: [String],
      default: []
    },
    aadhaarHash: {
      type: String,
      default: null
    },
    profileCompleted: {
      type: Boolean,
      default: false,
      index: true
    },
    class: {
      type: String,
      required: true,
      trim: true
    },
    section: {
      type: String,
      required: true,
      trim: true
    },
    admissionYear: {
      type: Number,
      required: true
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
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  { timestamps: true }
);

studentSchema.index({ schoolId: 1, uid: 1 }, { unique: true });

studentSchema.pre('validate', async function createUID() {
  if (!this.uid && this.firstName && this.dob && this.admissionYear) {
    this.uid = await generateStudentUID({
      firstName: this.firstName,
      dob: this.dob,
      admissionYear: this.admissionYear
    });
  }

  this.name = `${this.firstName} ${this.lastName}`.trim();
  if (!this.fullName) this.fullName = this.name;
  if (!this.dateOfBirth && this.dob) this.dateOfBirth = this.dob;
});

const Student = mongoose.model('Student', studentSchema);

export default Student;
