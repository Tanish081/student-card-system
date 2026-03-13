import bcrypt from 'bcryptjs';
import Student from '../models/Student.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendError, sendSuccess } from '../utils/apiResponse.js';
import { logAuditAction } from '../services/auditService.js';

const requiredFields = ['parentName', 'parentContact', 'address', 'city', 'state', 'pincode'];

export const completeStudentProfile = asyncHandler(async (req, res) => {
  if (req.user.role !== 'student') {
    return sendError(res, 'Only students can complete profile', 403);
  }

  const uid = req.user.linkedStudentUID;
  if (!uid) {
    return sendError(res, 'Student account is not linked to a student record', 400);
  }

  const student = await Student.findOne({ schoolId: req.schoolId, uid });
  if (!student) return sendError(res, 'Student record not found', 404);

  const missing = requiredFields.filter((field) => !req.body[field]);
  if (missing.length) {
    return sendError(res, `Missing required fields: ${missing.join(', ')}`, 400);
  }

  const {
    gender,
    address,
    city,
    state,
    pincode,
    parentName,
    parentContact,
    familyIncome,
    category,
    aadhaar
  } = req.body;

  student.fullName = student.name;
  student.dateOfBirth = student.dob;
  student.gender = gender || student.gender || null;
  student.address = address;
  student.city = city;
  student.state = state;
  student.pincode = String(pincode);
  student.parentName = parentName;
  student.parentContact = parentContact;
  student.familyIncome = familyIncome !== undefined ? Number(familyIncome) : student.familyIncome;
  student.category = category || student.category || null;

  if (aadhaar) {
    student.aadhaarHash = await bcrypt.hash(String(aadhaar), 10);
  }

  student.profileCompleted = true;
  await student.save();

  await logAuditAction({
    req,
    action: 'profile-completed',
    entityType: 'Student',
    entityId: student._id,
    metadata: {
      studentUID: student.uid
    }
  });

  return sendSuccess(res, 'Student profile completed successfully', {
    studentUID: student.uid,
    profileCompleted: student.profileCompleted
  });
});
