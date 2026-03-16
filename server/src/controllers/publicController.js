import Student from '../models/Student.js';
import Achievement from '../models/Achievement.js';
import User from '../models/User.js';
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

  const [spi, achievementCount, principal] = await Promise.all([
    computeStudentSPI(uid, schoolId),
    Achievement.countDocuments({
      studentUID: uid,
      schoolId,
      status: ACHIEVEMENT_STATUS.APPROVED
    }),
    User.findOne({ schoolId, role: 'principal' }).select('name').lean()
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
    uid: student.uid,
    name: student.name,
    school: process.env.SCHOOL_NAME || 'Government Senior Secondary School',
    class: student.class,
    section: student.section,
    spi: spi.spi,
    spiCategory: spi.category,
    achievementCount,
    verificationStatus: student.profileCompleted ? 'Verified' : 'Profile Incomplete'
      ,
    issuingPrincipalName: principal?.name || 'Principal Office'
  });
});
