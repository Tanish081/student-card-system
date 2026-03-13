import TeacherRole from '../models/TeacherRole.js';
import Student from '../models/Student.js';
import AcademicRecord from '../models/AcademicRecord.js';
import Guidance from '../models/Guidance.js';
import { TEACHER_SUB_ROLES } from '../config/constants.js';
import { ensureSubject } from '../services/masterDataService.js';
import { logAuditAction } from '../services/auditService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendError, sendSuccess } from '../utils/apiResponse.js';

const studentClassKey = (student) => `${student.class}${student.section}`;

const teacherHasClassAccess = (roles, classKey) =>
  roles.some((entry) => entry.class && entry.class === classKey);

const teacherCanAddMarks = (roles, classKey, subject) => {
  const normalizedSubject = String(subject).toLowerCase();

  return roles.some((entry) => {
    if (entry.role === TEACHER_SUB_ROLES.CLASS_TEACHER && entry.class === classKey) {
      return true;
    }

    if (
      entry.role === TEACHER_SUB_ROLES.SUBJECT_TEACHER &&
      entry.class === classKey &&
      String(entry.subject || '').toLowerCase() === normalizedSubject
    ) {
      return true;
    }

    return false;
  });
};

export const assignTeacherRoleMapping = asyncHandler(async (req, res) => {
  const { teacherID, role, class: mappedClass, subject } = req.body;
  const schoolId = req.schoolId;

  if (!teacherID || !role) {
    return sendError(res, 'teacherID and role are required', 400);
  }

  if (!Object.values(TEACHER_SUB_ROLES).includes(role)) {
    return sendError(res, 'Invalid teacher sub-role provided', 400);
  }

  if (role === TEACHER_SUB_ROLES.SUBJECT_TEACHER && (!mappedClass || !subject)) {
    return sendError(res, 'SubjectTeacher mapping requires class and subject', 400);
  }

  if (role === TEACHER_SUB_ROLES.CLASS_TEACHER && !mappedClass) {
    return sendError(res, 'ClassTeacher mapping requires class', 400);
  }

  const mapping = await TeacherRole.create({
    schoolId,
    teacherID,
    role,
    class: mappedClass || null,
    subject: subject || null
  });

  return sendSuccess(res, 'Teacher role mapping created successfully', mapping, 201);
});

export const getTeacherRoleMappings = asyncHandler(async (req, res) => {
  const { teacherID } = req.params;
  const schoolId = req.schoolId;

  if (req.user.role === 'teacher' && req.user.linkedTeacherID !== teacherID) {
    return sendError(res, 'Teachers can only view their own role mappings', 403);
  }

  const mappings = await TeacherRole.find({ teacherID, schoolId }).sort({ class: 1, role: 1 }).lean();

  return sendSuccess(res, 'Teacher role mappings fetched successfully', {
    teacherID,
    count: mappings.length,
    mappings
  });
});

export const getMyAssignments = asyncHandler(async (req, res) => {
  const teacherID = req.user.linkedTeacherID;
  const schoolId = req.schoolId;

  if (!teacherID) return sendError(res, 'Teacher account is not linked to teacherID', 400);

  const assignments = await TeacherRole.find({ teacherID, schoolId }).sort({ class: 1 }).lean();

  return sendSuccess(res, 'Teacher assignments fetched successfully', {
    teacherID,
    assignments
  });
});

export const getMyStudents = asyncHandler(async (req, res) => {
  const teacherID = req.user.linkedTeacherID;
  const schoolId = req.schoolId;

  const roles = await TeacherRole.find({ teacherID, schoolId }).lean();
  const allowedClasses = new Set(roles.map((item) => item.class).filter(Boolean));

  let students = await Student.find({ schoolId }).sort({ class: 1, section: 1, firstName: 1 }).lean();
  students = students.filter((student) => allowedClasses.has(studentClassKey(student)));

  return sendSuccess(res, 'Students for teacher fetched successfully', {
    count: students.length,
    students
  });
});

export const addAcademicRecord = asyncHandler(async (req, res) => {
  const { studentUID, subject, marks, examType } = req.body;
  const schoolId = req.schoolId;
  const teacherID = req.user.linkedTeacherID;

  if (!teacherID) return sendError(res, 'Teacher account is not linked to teacherID', 400);

  if (!studentUID || !subject || marks === undefined || !examType) {
    return sendError(res, 'studentUID, subject, marks, and examType are required', 400);
  }

  const student = await Student.findOne({ uid: studentUID, schoolId }).lean();
  if (!student) return sendError(res, 'Student not found', 404);

  const roles = await TeacherRole.find({ teacherID, schoolId }).lean();
  const canAdd = teacherCanAddMarks(roles, studentClassKey(student), subject);

  if (!canAdd) {
    return sendError(res, 'Teacher does not have subject/class mapping for this student', 403);
  }

  const record = await AcademicRecord.create({
    schoolId,
    studentUID,
    subject,
    subjectRef: (await ensureSubject({ schoolId, subjectName: subject }))?._id || null,
    marks: Number(marks),
    examType,
    teacherID
  });

  await logAuditAction({
    req,
    action: 'academic-record-added',
    entityType: 'AcademicRecord',
    entityId: record._id,
    metadata: {
      studentUID,
      subject,
      marks: Number(marks),
      examType
    }
  });

  return sendSuccess(res, 'Academic record added successfully', record, 201);
});

export const getStudentAcademicRecords = asyncHandler(async (req, res) => {
  const { uid } = req.params;
  const schoolId = req.schoolId;

  const records = await AcademicRecord.find({ studentUID: uid, schoolId }).sort({ createdAt: -1 }).lean();

  return sendSuccess(res, 'Academic records fetched successfully', {
    count: records.length,
    records
  });
});

export const updateAcademicRecord = asyncHandler(async (req, res) => {
  const { recordId } = req.params;
  const { marks, examType } = req.body;
  const schoolId = req.schoolId;
  const teacherID = req.user.linkedTeacherID;

  if (!teacherID) return sendError(res, 'Teacher account is not linked to teacherID', 400);

  const record = await AcademicRecord.findOne({ _id: recordId, schoolId });
  if (!record) return sendError(res, 'Academic record not found', 404);

  if (record.teacherID !== teacherID) {
    return sendError(res, 'Teachers cannot modify academic records created by another teacher', 403);
  }

  if (marks !== undefined) record.marks = Number(marks);
  if (examType) record.examType = examType;

  await record.save();

  return sendSuccess(res, 'Academic record updated successfully', record);
});

export const addGuidance = asyncHandler(async (req, res) => {
  const { studentUID, message } = req.body;
  const schoolId = req.schoolId;
  const teacherID = req.user.linkedTeacherID;

  if (!teacherID) return sendError(res, 'Teacher account is not linked to teacherID', 400);
  if (!studentUID || !message) return sendError(res, 'studentUID and message are required', 400);

  const student = await Student.findOne({ uid: studentUID, schoolId }).lean();
  if (!student) return sendError(res, 'Student not found', 404);

  const roles = await TeacherRole.find({ teacherID, schoolId }).lean();
  const hasAccess = teacherHasClassAccess(roles, studentClassKey(student));

  if (!hasAccess) return sendError(res, 'Teacher is not assigned to this student class', 403);

  const guidance = await Guidance.create({
    schoolId,
    studentUID,
    message,
    addedByTeacherID: teacherID
  });

  return sendSuccess(res, 'Guidance added successfully', guidance, 201);
});
