import User from '../models/User.js';
import Teacher from '../models/Teacher.js';
import TeacherRole from '../models/TeacherRole.js';
import Student from '../models/Student.js';
import { ROLES, TEACHER_SUB_ROLES } from '../config/constants.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendError, sendSuccess } from '../utils/apiResponse.js';
import { ensureClassSection, ensureSubject, parseClassAssignment } from '../services/masterDataService.js';
import { logAuditAction } from '../services/auditService.js';

export const createTeacherAccount = asyncHandler(async (req, res) => {
  const { teacherID, name, email, password } = req.body;
  const schoolId = req.schoolId;

  if (!teacherID || !name || !email || !password) {
    return sendError(res, 'teacherID, name, email, and password are required', 400);
  }

  const [existingUser, existingTeacher] = await Promise.all([
    User.findOne({ schoolId, email: email.toLowerCase() }),
    Teacher.findOne({ schoolId, teacherID })
  ]);

  if (existingUser) return sendError(res, 'User with this email already exists', 409);
  if (existingTeacher) return sendError(res, 'Teacher with this teacherID already exists', 409);

  const user = await User.create({
    schoolId,
    name,
    email,
    password,
    role: ROLES.TEACHER,
    linkedTeacherID: teacherID
  });

  const teacher = await Teacher.create({
    schoolId,
    teacherID,
    name,
    email,
    userId: user._id
  });

  return sendSuccess(res, 'Teacher account created successfully', { user, teacher }, 201);
});

export const createStudentAccount = asyncHandler(async (req, res) => {
  const { firstName, lastName, dob, class: className, section, admissionYear, email, password } = req.body;
  const schoolId = req.schoolId;

  if (!firstName || !lastName || !dob || !className || !section || !admissionYear || !email || !password) {
    return sendError(
      res,
      'firstName, lastName, dob, class, section, admissionYear, email, and password are required',
      400
    );
  }

  const existingUser = await User.findOne({ schoolId, email: email.toLowerCase() });
  if (existingUser) return sendError(res, 'User with this email already exists', 409);

  const { classDoc, sectionDoc } = await ensureClassSection({
    schoolId,
    className,
    sectionName: section
  });

  let student;
  try {
    student = await Student.create({
      schoolId,
      firstName,
      lastName,
      dob,
      class: String(className),
      section: String(section).toUpperCase(),
      admissionYear: Number(admissionYear),
      classRef: classDoc?._id || null,
      sectionRef: sectionDoc?._id || null,
      profileCompleted: false
    });
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 'Student UID already exists for the provided identity data', 409);
    }
    throw error;
  }

  const user = await User.create({
    schoolId,
    name: student.name,
    email,
    password,
    role: ROLES.STUDENT,
    linkedStudentUID: student.uid
  });

  student.userId = user._id;
  await student.save();

  return sendSuccess(res, 'Student account created successfully', { user, student }, 201);
});

export const assignTeacherRole = asyncHandler(async (req, res) => {
  const { teacherID, role, class: classAssignment, subject } = req.body;
  const schoolId = req.schoolId;

  if (!teacherID || !role) {
    return sendError(res, 'teacherID and role are required', 400);
  }

  if (!Object.values(TEACHER_SUB_ROLES).includes(role)) {
    return sendError(res, 'Invalid teacher sub-role provided', 400);
  }

  const teacher = await Teacher.findOne({ schoolId, teacherID }).lean();
  if (!teacher) return sendError(res, 'Teacher not found', 404);

  let classDoc = null;
  let sectionDoc = null;
  let classValue = null;

  if (classAssignment) {
    const parsed = parseClassAssignment(classAssignment);
    if (!parsed.className || !parsed.sectionName) {
      return sendError(res, 'Class assignment must be in format like 8A or 10B', 400);
    }

    const resolved = await ensureClassSection({
      schoolId,
      className: parsed.className,
      sectionName: parsed.sectionName
    });

    classDoc = resolved.classDoc;
    sectionDoc = resolved.sectionDoc;
    classValue = `${parsed.className}${parsed.sectionName}`;
  }

  if (role === TEACHER_SUB_ROLES.CLASS_TEACHER && !classValue) {
    return sendError(res, 'ClassTeacher mapping requires class assignment', 400);
  }

  if (role === TEACHER_SUB_ROLES.SUBJECT_TEACHER && (!classValue || !subject)) {
    return sendError(res, 'SubjectTeacher mapping requires class and subject', 400);
  }

  const subjectDoc = await ensureSubject({ schoolId, subjectName: subject });

  try {
    const mapping = await TeacherRole.create({
      schoolId,
      teacherID,
      role,
      class: classValue,
      subject: subject || null,
      classRef: classDoc?._id || null,
      sectionRef: sectionDoc?._id || null,
      subjectRef: subjectDoc?._id || null
    });

    await logAuditAction({
      req,
      action: 'teacher-role-assigned',
      entityType: 'TeacherRole',
      entityId: mapping._id,
      metadata: {
        teacherID,
        role,
        class: mapping.class,
        subject: mapping.subject
      }
    });

    return sendSuccess(res, 'Teacher role assigned successfully', mapping);
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 'Duplicate teacher role mapping already exists', 409);
    }
    throw error;
  }
});

export const removeTeacherRole = asyncHandler(async (req, res) => {
  const { mappingId } = req.params;
  const schoolId = req.schoolId;

  const mapping = await TeacherRole.findOne({ _id: mappingId, schoolId });
  if (!mapping) return sendError(res, 'Teacher role mapping not found', 404);

  await TeacherRole.deleteOne({ _id: mappingId, schoolId });

  await logAuditAction({
    req,
    action: 'teacher-role-removed',
    entityType: 'TeacherRole',
    entityId: mappingId,
    metadata: {
      teacherID: mapping.teacherID,
      role: mapping.role,
      class: mapping.class,
      subject: mapping.subject
    }
  });

  return sendSuccess(res, 'Teacher role mapping removed successfully', {
    mappingId
  });
});

export const getTeachers = asyncHandler(async (req, res) => {
  const schoolId = req.schoolId;

  const [teachers, mappings] = await Promise.all([
    Teacher.find({ schoolId }).sort({ teacherID: 1 }).lean(),
    TeacherRole.find({ schoolId }).sort({ teacherID: 1, class: 1 }).lean()
  ]);

  const mappedTeachers = teachers.map((teacher) => ({
    ...teacher,
    assignments: mappings.filter((item) => item.teacherID === teacher.teacherID)
  }));

  return sendSuccess(res, 'Teachers fetched successfully', {
    count: mappedTeachers.length,
    teachers: mappedTeachers
  });
});

export const getStudents = asyncHandler(async (req, res) => {
  const schoolId = req.schoolId;
  const students = await Student.find({ schoolId }).sort({ class: 1, section: 1, firstName: 1 }).lean();

  return sendSuccess(res, 'Students fetched successfully', {
    count: students.length,
    students
  });
});
