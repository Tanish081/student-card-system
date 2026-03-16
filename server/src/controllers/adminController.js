import User from '../models/User.js';
import Teacher from '../models/Teacher.js';
import TeacherRole from '../models/TeacherRole.js';
import Student from '../models/Student.js';
import Achievement from '../models/Achievement.js';
import AuditLog from '../models/AuditLog.js';
import Opportunity from '../models/Opportunity.js';
import OpportunityApplication from '../models/OpportunityApplication.js';
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

export const getOverviewStats = asyncHandler(async (req, res) => {
  const schoolId = req.schoolId;

  const [
    totalStudents,
    verifiedAchievements,
    schemeEligible,
    distinctSchools,
    pendingReviews,
    qrVerifications,
    applicationsOpen,
    flaggedSchools
  ] = await Promise.all([
    Student.countDocuments({ schoolId }),
    Achievement.countDocuments({ schoolId, status: 'approved' }),
    Student.countDocuments({
      schoolId,
      eligibilityFlags: {
        $elemMatch: { eligible: true }
      }
    }),
    Student.distinct('schoolId', { schoolId }).then((ids) => ids.length),
    Achievement.countDocuments({ schoolId, status: 'pending' }),
    AuditLog.countDocuments({ schoolId, action: { $regex: 'qr', $options: 'i' } }),
    OpportunityApplication.countDocuments({ schoolId, status: 'applied' }),
    AuditLog.countDocuments({ schoolId, action: { $regex: 'school-flagged|school_flagged', $options: 'i' } })
  ]);

  return sendSuccess(res, 'Overview statistics fetched successfully', {
    totalStudents,
    verifiedAchievements,
    schemeEligible,
    activeSchools: distinctSchools,
    pendingReviews,
    qrVerifications,
    applicationsOpen,
    flaggedSchools
  });
});

export const getOverviewRecentActivity = asyncHandler(async (req, res) => {
  const schoolId = req.schoolId;
  const limit = Math.min(10, Math.max(1, Number(req.query.limit) || 5));

  const logs = await AuditLog.find({ schoolId })
    .sort({ eventTimestamp: -1, _id: -1 })
    .limit(limit)
    .lean();

  const items = logs.map((log) => ({
    id: log._id,
    action: log.action,
    actor: log.performedByName,
    role: log.performedByRole,
    entityType: log.entityType,
    entityId: log.entityId,
    timestamp: log.eventTimestamp || log.createdAt,
    metadata: log.metadata || {}
  }));

  return sendSuccess(res, 'Overview activity fetched successfully', { items });
});

export const getStudentsSection = asyncHandler(async (req, res) => {
  const schoolId = req.schoolId;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 20));
  const search = String(req.query.search || '').trim();
  const selectedSchool = String(req.query.school || '').trim();
  const status = String(req.query.status || '').trim().toLowerCase();
  const spiMin = Number(req.query.spiMin || 0);
  const spiMax = Number(req.query.spiMax || 1000);
  const sortBy = String(req.query.sortBy || 'spiTotal');
  const sortOrder = String(req.query.sortOrder || 'desc') === 'asc' ? 1 : -1;

  const query = { schoolId };

  if (search) {
    query.$or = [
      { uid: { $regex: search, $options: 'i' } },
      { name: { $regex: search, $options: 'i' } },
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } }
    ];
  }

  if (selectedSchool) {
    query.schoolId = selectedSchool;
  }

  if (status === 'eligible') {
    query.eligibilityFlags = { $elemMatch: { eligible: true } };
  }

  if (status === 'ineligible') {
    query.$or = [...(query.$or || []), { eligibilityFlags: { $size: 0 } }];
  }

  query.spiTotal = { $gte: spiMin, $lte: spiMax };

  const allowedSort = new Set(['name', 'spiTotal', 'uid', 'class', 'createdAt']);
  const effectiveSortBy = allowedSort.has(sortBy) ? sortBy : 'spiTotal';
  const skip = (page - 1) * limit;

  const [students, total] = await Promise.all([
    Student.find(query)
      .sort({ [effectiveSortBy]: sortOrder, _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Student.countDocuments(query)
  ]);

  return sendSuccess(res, 'Students section data fetched successfully', {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    count: students.length,
    students
  });
});

export const getStudentSectionDetail = asyncHandler(async (req, res) => {
  const schoolId = req.schoolId;
  const { uid } = req.params;

  const student = await Student.findOne({ schoolId, uid }).lean();
  if (!student) return sendError(res, 'Student not found', 404);

  const [achievements, logs] = await Promise.all([
    Achievement.find({ schoolId, studentUID: uid }).sort({ createdAt: -1 }).lean(),
    AuditLog.find({ schoolId, 'metadata.studentUID': uid }).sort({ eventTimestamp: -1, _id: -1 }).limit(30).lean()
  ]);

  return sendSuccess(res, 'Student detail fetched successfully', {
    student,
    achievements,
    eligibility: student.eligibilityFlags || [],
    auditTrail: logs
  });
});

export const getSchoolsSection = asyncHandler(async (req, res) => {
  const schoolId = req.schoolId;

  const students = await Student.find({ schoolId })
    .select('schoolId spiTotal')
    .lean();

  const schoolBuckets = new Map();

  students.forEach((student) => {
    const key = student.schoolId || schoolId;
    if (!schoolBuckets.has(key)) {
      schoolBuckets.set(key, {
        id: key,
        schoolName: key,
        district: '-',
        students: 0,
        spiTotal: 0,
        verifiedAchievements: 0,
        totalAchievements: 0,
        status: 'active'
      });
    }

    const entry = schoolBuckets.get(key);
    entry.students += 1;
    entry.spiTotal += Number(student.spiTotal || 0);
  });

  const achievements = await Achievement.aggregate([
    { $match: { schoolId } },
    {
      $group: {
        _id: '$schoolId',
        total: { $sum: 1 },
        verified: {
          $sum: {
            $cond: [{ $eq: ['$status', 'approved'] }, 1, 0]
          }
        }
      }
    }
  ]);

  achievements.forEach((item) => {
    const key = item._id || schoolId;
    if (!schoolBuckets.has(key)) {
      schoolBuckets.set(key, {
        id: key,
        schoolName: key,
        district: '-',
        students: 0,
        spiTotal: 0,
        verifiedAchievements: 0,
        totalAchievements: 0,
        status: 'active'
      });
    }
    const entry = schoolBuckets.get(key);
    entry.totalAchievements = item.total;
    entry.verifiedAchievements = item.verified;
  });

  const rows = Array.from(schoolBuckets.values()).map((entry) => ({
    id: entry.id,
    schoolName: entry.schoolName,
    district: entry.district,
    students: entry.students,
    avgSPI: entry.students ? Math.round(entry.spiTotal / entry.students) : 0,
    verifiedPercent: entry.totalAchievements
      ? Math.round((entry.verifiedAchievements / entry.totalAchievements) * 100)
      : 0,
    status: entry.status
  }));

  return sendSuccess(res, 'Schools section data fetched successfully', {
    count: rows.length,
    schools: rows
  });
});

export const getAchievementsSection = asyncHandler(async (req, res) => {
  const schoolId = req.schoolId;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 20));
  const status = String(req.query.status || 'pending').toLowerCase();

  const statusMap = {
    pending: 'pending',
    verified: 'approved',
    approved: 'approved',
    rejected: 'rejected',
    all: null
  };
  const effectiveStatus = statusMap[status] ?? 'pending';

  const query = { schoolId };
  if (effectiveStatus) {
    query.status = effectiveStatus;
  }

  const skip = (page - 1) * limit;
  const [achievements, total] = await Promise.all([
    Achievement.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Achievement.countDocuments(query)
  ]);

  const studentUIDs = [...new Set(achievements.map((item) => item.studentUID).filter(Boolean))];
  const students = studentUIDs.length
    ? await Student.find({ schoolId, uid: { $in: studentUIDs } })
      .select('uid name schoolId')
      .lean()
    : [];
  const studentByUid = new Map(students.map((student) => [student.uid, student]));

  const rows = achievements.map((item) => {
    const student = studentByUid.get(item.studentUID);
    return {
      ...item,
      studentName: student?.name || item.studentUID,
      schoolName: student?.schoolId || schoolId,
      statusLabel: item.status === 'approved' ? 'Verified' : item.status.charAt(0).toUpperCase() + item.status.slice(1)
    };
  });

  return sendSuccess(res, 'Achievements section data fetched successfully', {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    count: rows.length,
    achievements: rows
  });
});

export const updateAchievementStatus = asyncHandler(async (req, res) => {
  const schoolId = req.schoolId;
  const { achievementId } = req.params;
  const { status, reason } = req.body;

  const statusMap = {
    verified: 'approved',
    approved: 'approved',
    rejected: 'rejected'
  };
  const nextStatus = statusMap[String(status || '').toLowerCase()];

  if (!nextStatus) {
    return sendError(res, 'status must be verified or rejected', 400);
  }

  const achievement = await Achievement.findOne({ _id: achievementId, schoolId });
  if (!achievement) return sendError(res, 'Achievement not found', 404);

  achievement.status = nextStatus;
  achievement.verifiedBy = req.user.name;
  if (reason) {
    achievement.set('rejectionReason', String(reason).trim());
  }
  await achievement.save();

  await logAuditAction({
    req,
    action: `achievement-${nextStatus}`,
    entityType: 'Achievement',
    entityId: achievement._id,
    metadata: {
      studentUID: achievement.studentUID,
      status: nextStatus,
      reason: reason || null
    }
  });

  return sendSuccess(res, 'Achievement updated successfully', achievement);
});

export const bulkUpdateAchievementStatus = asyncHandler(async (req, res) => {
  const schoolId = req.schoolId;
  const { achievementIds = [], status, reason } = req.body;

  if (!Array.isArray(achievementIds) || !achievementIds.length) {
    return sendError(res, 'achievementIds is required', 400);
  }

  const statusMap = {
    verified: 'approved',
    approved: 'approved',
    rejected: 'rejected'
  };
  const nextStatus = statusMap[String(status || '').toLowerCase()];

  if (!nextStatus) {
    return sendError(res, 'status must be verified or rejected', 400);
  }

  const result = await Achievement.updateMany(
    { _id: { $in: achievementIds }, schoolId },
    {
      $set: {
        status: nextStatus,
        verifiedBy: req.user.name,
        updatedAt: new Date()
      }
    }
  );

  await logAuditAction({
    req,
    action: `achievement-bulk-${nextStatus}`,
    entityType: 'Achievement',
    entityId: `bulk:${achievementIds.length}`,
    metadata: {
      status: nextStatus,
      count: achievementIds.length,
      reason: reason || null
    }
  });

  return sendSuccess(res, 'Achievement bulk update completed', {
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount
  });
});

export const getOpportunitiesSection = asyncHandler(async (req, res) => {
  const schoolId = req.schoolId;
  const [opportunities, applicationSummary] = await Promise.all([
    Opportunity.find({ schoolId }).sort({ createdAt: -1 }).limit(50).lean(),
    OpportunityApplication.aggregate([
      { $match: { schoolId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  const analytics = {
    applied: 0,
    shortlisted: 0,
    selected: 0,
    rejected: 0
  };

  applicationSummary.forEach((item) => {
    analytics[item._id] = item.count;
  });

  return sendSuccess(res, 'Opportunities section data fetched successfully', {
    opportunities,
    analytics
  });
});

export const getSchemeEligibilitySection = asyncHandler(async (req, res) => {
  const schoolId = req.schoolId;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 20));
  const schemeName = String(req.query.schemeName || '').trim().toLowerCase();

  const query = { schoolId };
  if (schemeName) {
    query.eligibilityFlags = {
      $elemMatch: {
        schemeName: { $regex: schemeName, $options: 'i' }
      }
    };
  }

  const skip = (page - 1) * limit;
  const [students, total] = await Promise.all([
    Student.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Student.countDocuments(query)
  ]);

  const rows = students.map((student) => ({
    uid: student.uid,
    studentName: student.name,
    schoolName: student.schoolId,
    spi: student.spiTotal || 0,
    eligibleSchemes: (student.eligibilityFlags || [])
      .filter((flag) => flag.eligible)
      .map((flag) => flag.schemeName)
      .filter(Boolean),
    updatedAt: student.updatedAt
  }));

  return sendSuccess(res, 'Scheme eligibility section data fetched successfully', {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    count: rows.length,
    rows
  });
});

export const getAuditLogsSection = asyncHandler(async (req, res) => {
  const schoolId = req.schoolId;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(25, Math.max(1, Number(req.query.limit) || 20));

  const query = { schoolId };
  if (req.query.actor) {
    query.performedByName = { $regex: String(req.query.actor), $options: 'i' };
  }
  if (req.query.action) {
    query.action = { $regex: String(req.query.action), $options: 'i' };
  }

  if (req.query.startDate || req.query.endDate) {
    query.eventTimestamp = {};
    if (req.query.startDate) query.eventTimestamp.$gte = new Date(req.query.startDate);
    if (req.query.endDate) query.eventTimestamp.$lte = new Date(req.query.endDate);
  }

  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .sort({ eventTimestamp: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(query)
  ]);

  return sendSuccess(res, 'Audit section data fetched successfully', {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    count: logs.length,
    logs
  });
});
