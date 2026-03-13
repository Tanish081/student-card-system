import ParticipationRecord from '../models/ParticipationRecord.js';
import Student from '../models/Student.js';
import TeacherRole from '../models/TeacherRole.js';
import { TEACHER_SUB_ROLES } from '../config/constants.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendError, sendSuccess } from '../utils/apiResponse.js';
import { logAuditAction } from '../services/auditService.js';

const classKey = (student) => `${student.class}${student.section}`;

const teacherHasAccessToStudent = async (teacherID, student, schoolId) => {
  const roles = await TeacherRole.find({ teacherID, schoolId }).lean();
  return roles.some((entry) => entry.class === classKey(student));
};

export const addParticipationRecord = asyncHandler(async (req, res) => {
  const { studentUID, activityName, category, date } = req.body;
  const schoolId = req.schoolId;
  const teacherID = req.user.linkedTeacherID;

  if (!teacherID) return sendError(res, 'Teacher account is not linked to teacherID', 400);
  if (!studentUID || !activityName || !category || !date) {
    return sendError(res, 'studentUID, activityName, category, and date are required', 400);
  }

  const student = await Student.findOne({ schoolId, uid: studentUID }).lean();
  if (!student) return sendError(res, 'Student not found', 404);

  const hasAccess = await teacherHasAccessToStudent(teacherID, student, schoolId);
  if (!hasAccess) return sendError(res, 'Teacher is not assigned to this student class', 403);

  const record = await ParticipationRecord.create({
    schoolId,
    studentUID,
    activityName,
    category,
    date,
    teacherID,
    status: 'Pending'
  });

  return sendSuccess(res, 'Participation record created successfully', record, 201);
});

export const approveParticipationRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status = 'Approved' } = req.body;
  const schoolId = req.schoolId;
  const teacherID = req.user.linkedTeacherID;

  if (!teacherID) return sendError(res, 'Teacher account is not linked to teacherID', 400);
  if (!['Approved', 'Rejected'].includes(status)) {
    return sendError(res, 'Status must be Approved or Rejected', 400);
  }

  const record = await ParticipationRecord.findOne({ _id: id, schoolId });
  if (!record) return sendError(res, 'Participation record not found', 404);

  const student = await Student.findOne({ schoolId, uid: record.studentUID }).lean();
  if (!student) return sendError(res, 'Student not found', 404);

  const classTeacherRole = await TeacherRole.findOne({
    schoolId,
    teacherID,
    role: TEACHER_SUB_ROLES.CLASS_TEACHER,
    class: classKey(student)
  }).lean();

  if (!classTeacherRole) {
    return sendError(res, 'Only class teacher for assigned class can approve participation', 403);
  }

  record.status = status;
  await record.save();

  await logAuditAction({
    req,
    action: 'participation-approved',
    entityType: 'ParticipationRecord',
    entityId: record._id,
    metadata: {
      studentUID: record.studentUID,
      status
    }
  });

  return sendSuccess(res, 'Participation status updated successfully', record);
});

export const getStudentParticipation = asyncHandler(async (req, res) => {
  const { uid } = req.params;
  const schoolId = req.schoolId;

  if (req.user.role === 'student' && req.user.linkedStudentUID !== uid) {
    return sendError(res, 'You can only view your own participation history', 403);
  }

  if (req.user.role === 'teacher') {
    const student = await Student.findOne({ schoolId, uid }).lean();
    if (!student) return sendError(res, 'Student not found', 404);

    const hasAccess = await teacherHasAccessToStudent(req.user.linkedTeacherID, student, schoolId);
    if (!hasAccess) return sendError(res, 'Teacher is not assigned to this student class', 403);
  }

  const records = await ParticipationRecord.find({ schoolId, studentUID: uid })
    .sort({ date: -1, createdAt: -1 })
    .lean();

  return sendSuccess(res, 'Participation records fetched successfully', {
    count: records.length,
    records
  });
});
