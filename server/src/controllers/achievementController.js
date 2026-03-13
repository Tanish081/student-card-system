import Achievement from '../models/Achievement.js';
import Student from '../models/Student.js';
import TeacherRole from '../models/TeacherRole.js';
import { ACHIEVEMENT_STATUS, TEACHER_SUB_ROLES } from '../config/constants.js';
import { calculateAchievementPoints } from '../services/pointsService.js';
import { logAuditAction } from '../services/auditService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendError, sendSuccess } from '../utils/apiResponse.js';

const classKey = (student) => `${student.class}${student.section}`;

const teacherCanManageAchievement = async (teacherID, student, schoolId) => {
  if (!teacherID) return false;

  const roles = await TeacherRole.find({ teacherID, schoolId }).lean();

  return roles.some((roleEntry) => {
    if (roleEntry.role === TEACHER_SUB_ROLES.SPORTS_TEACHER) {
      return !roleEntry.class || roleEntry.class === classKey(student);
    }

    if (
      roleEntry.role === TEACHER_SUB_ROLES.CLASS_TEACHER ||
      roleEntry.role === TEACHER_SUB_ROLES.SUBJECT_TEACHER
    ) {
      return roleEntry.class === classKey(student);
    }

    return false;
  });
};

export const addAchievement = asyncHandler(async (req, res) => {
  const { studentUID, eventName, category, level, position, certificateURL } = req.body;
  const schoolId = req.schoolId;

  if (!studentUID || !eventName || !category || !level || !position) {
    return sendError(res, 'studentUID, eventName, category, level, and position are required', 400);
  }

  const student = await Student.findOne({ uid: studentUID, schoolId }).lean();
  if (!student) return sendError(res, 'Student not found', 404);

  if (req.user.role === 'teacher') {
    const canManage = await teacherCanManageAchievement(req.user.linkedTeacherID, student, schoolId);
    if (!canManage) return sendError(res, 'Teacher is not assigned to this student class', 403);
  }

  const points = calculateAchievementPoints({ position, level });

  const achievement = await Achievement.create({
    schoolId,
    studentUID,
    eventName,
    category,
    level,
    position,
    points,
    certificateURL,
    status: ACHIEVEMENT_STATUS.PENDING,
    enteredBy: req.user.linkedTeacherID || req.user.name
  });

  return sendSuccess(res, 'Achievement added successfully', achievement, 201);
});

export const verifyAchievement = asyncHandler(async (req, res) => {
  const { achievementId } = req.params;
  const { status } = req.body;
  const schoolId = req.schoolId;

  if (![ACHIEVEMENT_STATUS.APPROVED, ACHIEVEMENT_STATUS.REJECTED].includes(status)) {
    return sendError(res, 'Status must be Approved or Rejected', 400);
  }

  const achievement = await Achievement.findOne({ _id: achievementId, schoolId });
  if (!achievement) return sendError(res, 'Achievement not found', 404);

  if (req.user.role === 'teacher') {
    const student = await Student.findOne({ uid: achievement.studentUID, schoolId }).lean();
    if (!student) return sendError(res, 'Student not found for this achievement', 404);

    const roles = await TeacherRole.find({
      teacherID: req.user.linkedTeacherID,
      schoolId,
      role: TEACHER_SUB_ROLES.CLASS_TEACHER,
      class: `${student.class}${student.section}`
    }).lean();

    if (!roles.length) {
      return sendError(res, 'Only class teacher for assigned class can verify achievement', 403);
    }
  }

  achievement.status = status;
  achievement.verifiedBy = req.user.linkedTeacherID || req.user.name;
  await achievement.save();

  await logAuditAction({
    req,
    action: 'achievement-verified',
    entityType: 'Achievement',
    entityId: achievement._id,
    metadata: {
      studentUID: achievement.studentUID,
      status
    }
  });

  return sendSuccess(res, 'Achievement verification updated', achievement);
});

export const getStudentAchievements = asyncHandler(async (req, res) => {
  const { uid } = req.params;
  const schoolId = req.schoolId;

  if (req.user.role === 'student' && req.user.linkedStudentUID !== uid) {
    return sendError(res, 'You can only view your own achievements', 403);
  }

  const achievements = await Achievement.find({ studentUID: uid, schoolId })
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(res, 'Student achievements fetched successfully', {
    count: achievements.length,
    achievements
  });
});
