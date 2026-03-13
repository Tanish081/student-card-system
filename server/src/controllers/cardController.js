import Student from '../models/Student.js';
import Achievement from '../models/Achievement.js';
import ParticipationRecord from '../models/ParticipationRecord.js';
import { ACHIEVEMENT_STATUS } from '../config/constants.js';
import { sendError } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { computeStudentSPI } from '../services/spiService.js';
import { generateStudentCardPdf } from '../services/cardService.js';
import { generateStudentVerificationQrPng } from '../services/qrService.js';
import { logAuditAction } from '../services/auditService.js';

const ensureViewerAccess = (req, uid) => {
  if (req.user.role === 'student' && req.user.linkedStudentUID !== uid) {
    const error = new Error('Students can only access their own card and QR code');
    error.statusCode = 403;
    throw error;
  }
};

export const downloadStudentCard = asyncHandler(async (req, res) => {
  const { uid } = req.params;
  const schoolId = req.schoolId;

  ensureViewerAccess(req, uid);

  const student = await Student.findOne({ uid, schoolId }).lean();
  if (!student) return sendError(res, 'Student not found', 404);

  const [spi, achievements, achievementCount, participation] = await Promise.all([
    computeStudentSPI(uid, schoolId),
    Achievement.find({ studentUID: uid, schoolId, status: ACHIEVEMENT_STATUS.APPROVED })
      .sort({ points: -1, createdAt: -1 })
      .limit(3)
      .lean(),
    Achievement.countDocuments({ studentUID: uid, schoolId, status: ACHIEVEMENT_STATUS.APPROVED }),
    ParticipationRecord.find({ studentUID: uid, schoolId }).lean()
  ]);

  const participationSummary = {
    total: participation.length,
    approved: participation.filter((item) => item.status === 'Approved').length,
    pending: participation.filter((item) => item.status === 'Pending').length,
    rejected: participation.filter((item) => item.status === 'Rejected').length
  };

  const pdfBuffer = await generateStudentCardPdf({
    student,
    spi,
    topAchievements: achievements,
    participationSummary: {
      ...participationSummary,
      achievementCount
    }
  });

  await logAuditAction({
    req,
    action: 'student-card-generated',
    entityType: 'Student',
    entityId: student._id,
    metadata: {
      studentUID: uid
    }
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="student-card-${uid}.pdf"`);
  res.send(pdfBuffer);
});

export const getStudentQrCode = asyncHandler(async (req, res) => {
  const { uid } = req.params;
  const schoolId = req.schoolId;

  ensureViewerAccess(req, uid);

  const student = await Student.findOne({ uid, schoolId }).lean();
  if (!student) return sendError(res, 'Student not found', 404);

  const pngBuffer = await generateStudentVerificationQrPng({ uid });

  res.setHeader('Content-Type', 'image/png');
  res.send(pngBuffer);
});
