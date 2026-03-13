import Student from '../models/Student.js';
import Achievement from '../models/Achievement.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendError, sendSuccess } from '../utils/apiResponse.js';
import { computeStudentSPI } from '../services/spiService.js';
import { ACHIEVEMENT_STATUS } from '../config/constants.js';
import { logAuditAction } from '../services/auditService.js';

export const getPublicStudentVerification = asyncHandler(async (req, res) => {
  const { uid } = req.params;
  const schoolId = process.env.DEFAULT_SCHOOL_ID || 'SCH001';

  const student = await Student.findOne({ uid, schoolId }).lean();
  if (!student) return sendError(res, 'Student not found', 404);

  const [spi, topAchievements] = await Promise.all([
    computeStudentSPI(uid, schoolId),
    Achievement.find({
      studentUID: uid,
      schoolId,
      status: ACHIEVEMENT_STATUS.APPROVED
    })
      .sort({ points: -1, createdAt: -1 })
      .limit(3)
      .select('eventName category level position points')
      .lean()
  ]);

  await logAuditAction({
    action: 'public-verification-requested',
    entityType: 'Student',
    entityId: student._id,
    metadata: {
      studentUID: uid
    },
    schoolId,
    actor: {
      id: 'public',
      role: 'public',
      name: 'Public Verification Portal'
    }
  });

  return sendSuccess(res, 'Public student verification fetched successfully', {
    name: student.name,
    class: student.class,
    section: student.section,
    spi: spi.spi,
    topAchievements,
    verificationStatus: student.profileCompleted ? 'Verified' : 'Profile Incomplete'
  });
});
