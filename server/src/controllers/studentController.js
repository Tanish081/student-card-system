import Student from '../models/Student.js';
import Achievement from '../models/Achievement.js';
import AcademicRecord from '../models/AcademicRecord.js';
import Guidance from '../models/Guidance.js';
import ParticipationRecord from '../models/ParticipationRecord.js';
import TeacherRole from '../models/TeacherRole.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendError, sendSuccess } from '../utils/apiResponse.js';
import { computeStudentSPI } from '../services/spiService.js';
import { ensureClassSection } from '../services/masterDataService.js';

const classKey = (student) => `${student.class}${student.section}`;

const canTeacherAccessStudent = async (teacherID, student, schoolId) => {
  if (!teacherID) return false;

  const assignments = await TeacherRole.find({ teacherID, schoolId }).lean();
  const allowedClasses = assignments.map((item) => item.class).filter(Boolean);

  return allowedClasses.includes(classKey(student));
};

export const createStudent = asyncHandler(async (req, res) => {
  const { firstName, lastName, dob, class: className, section, admissionYear } = req.body;
  const schoolId = req.schoolId;

  if (!firstName || !lastName || !dob || !className || !section || !admissionYear) {
    return sendError(
      res,
      'firstName, lastName, dob, class, section, and admissionYear are required',
      400
    );
  }

  const parsedClass = Number(className);
  if (Number.isNaN(parsedClass) || parsedClass < 6 || parsedClass > 10) {
    return sendError(res, 'Class must be between 6 and 10', 400);
  }

  const { classDoc, sectionDoc } = await ensureClassSection({
    schoolId,
    className: parsedClass,
    sectionName: section
  });

  try {
    const student = await Student.create({
      schoolId,
      firstName,
      lastName,
      dob,
      class: String(parsedClass),
      section: String(section).toUpperCase(),
      admissionYear: Number(admissionYear),
      classRef: classDoc?._id || null,
      sectionRef: sectionDoc?._id || null
    });

    return sendSuccess(res, 'Student created successfully', student, 201);
  } catch (error) {
    if (error.code === 11000) {
      return sendError(
        res,
        'Generated UID already exists. Please verify student details to avoid duplicates.',
        409
      );
    }
    throw error;
  }
});

export const getStudents = asyncHandler(async (req, res) => {
  const schoolId = req.schoolId;
  const { class: classFilter, section } = req.query;

  const query = { schoolId };
  if (classFilter) query.class = String(classFilter);
  if (section) query.section = String(section).toUpperCase();

  let students = await Student.find(query).sort({ class: 1, section: 1, firstName: 1 }).lean();

  if (req.user.role === 'teacher') {
    const teacherID = req.user.linkedTeacherID;
    const teacherRoles = await TeacherRole.find({ teacherID, schoolId }).lean();
    const allowedClasses = new Set(teacherRoles.map((item) => item.class).filter(Boolean));

    students = students.filter((student) => allowedClasses.has(`${student.class}${student.section}`));
  }

  return sendSuccess(res, 'Students fetched successfully', { count: students.length, students });
});

export const getStudentProfile = asyncHandler(async (req, res) => {
  const { uid } = req.params;
  const schoolId = req.schoolId;

  const student = await Student.findOne({ uid, schoolId }).lean();
  if (!student) return sendError(res, 'Student not found', 404);

  if (req.user.role === 'student' && req.user.linkedStudentUID !== uid) {
    return sendError(res, 'You can only view your own profile', 403);
  }

  if (req.user.role === 'teacher') {
    const allowed = await canTeacherAccessStudent(req.user.linkedTeacherID, student, schoolId);
    if (!allowed) return sendError(res, 'Teacher is not assigned to this student class', 403);
  }

  return sendSuccess(res, 'Student profile fetched successfully', student);
});

export const getStudentDashboard = asyncHandler(async (req, res) => {
  const { uid } = req.params;
  const schoolId = req.schoolId;

  const student = await Student.findOne({ uid, schoolId }).lean();
  if (!student) return sendError(res, 'Student not found', 404);

  if (req.user.role === 'student' && req.user.linkedStudentUID !== uid) {
    return sendError(res, 'You can only view your own dashboard', 403);
  }

  if (req.user.role === 'teacher') {
    const allowed = await canTeacherAccessStudent(req.user.linkedTeacherID, student, schoolId);
    if (!allowed) return sendError(res, 'Teacher is not assigned to this student class', 403);
  }

  const [achievements, academicRecords, guidance, participationRecords, spiBreakdown] = await Promise.all([
    Achievement.find({ studentUID: uid, schoolId }).sort({ createdAt: -1 }).lean(),
    AcademicRecord.find({ studentUID: uid, schoolId }).sort({ createdAt: -1 }).lean(),
    Guidance.find({ studentUID: uid, schoolId }).sort({ createdAt: -1 }).lean(),
    ParticipationRecord.find({ studentUID: uid, schoolId }).sort({ date: -1, createdAt: -1 }).lean(),
    computeStudentSPI(uid, schoolId)
  ]);

  const participationHistory = participationRecords.map((item) => ({
    activityName: item.activityName,
    category: item.category,
    status: item.status,
    date: item.date
  }));

  return sendSuccess(res, 'Student dashboard fetched successfully', {
    profile: student,
    uid: student.uid,
    spi: spiBreakdown,
    eligibility: spiBreakdown.eligibilityFlags || student.eligibilityFlags || [],
    achievements,
    teacherFeedback: guidance,
    participationHistory,
    academicRecords
  });
});

export const getStudentEligibility = asyncHandler(async (req, res) => {
  const { uid } = req.params;
  const schoolId = req.schoolId;

  const student = await Student.findOne({ uid, schoolId }).lean();
  if (!student) return sendError(res, 'Student not found', 404);

  if (req.user.role === 'student' && req.user.linkedStudentUID !== uid) {
    return sendError(res, 'You can only view your own eligibility profile', 403);
  }

  if (req.user.role === 'teacher') {
    const allowed = await canTeacherAccessStudent(req.user.linkedTeacherID, student, schoolId);
    if (!allowed) return sendError(res, 'Teacher is not assigned to this student class', 403);
  }

  const spi = await computeStudentSPI(uid, schoolId);

  return sendSuccess(res, 'Student eligibility fetched successfully', {
    uid: student.uid,
    name: student.name,
    category: student.category,
    spiTotal: spi.spiTotal,
    spiPercentile: spi.spiPercentile,
    pointsBreakdown: spi.pointsBreakdown,
    eligibilityFlags: spi.eligibilityFlags || []
  });
});
