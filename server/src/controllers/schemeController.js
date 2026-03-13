import Scheme from '../models/Scheme.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendError, sendSuccess } from '../utils/apiResponse.js';
import { findEligibleSchemesForStudent } from '../services/schemeService.js';
import { logAuditAction } from '../services/auditService.js';

export const createScheme = asyncHandler(async (req, res) => {
  const schoolId = req.schoolId;

  const scheme = await Scheme.create({
    schoolId,
    ...req.body,
    eligibleClasses: (req.body.eligibleClasses || []).map((value) => String(value))
  });

  await logAuditAction({
    req,
    action: 'scheme-created',
    entityType: 'Scheme',
    entityId: scheme._id,
    metadata: {
      schemeName: scheme.schemeName
    }
  });

  return sendSuccess(res, 'Scheme created successfully', scheme, 201);
});

export const getSchemes = asyncHandler(async (req, res) => {
  const schemes = await Scheme.find({ schoolId: req.schoolId }).sort({ createdAt: -1 }).lean();

  return sendSuccess(res, 'Schemes fetched successfully', {
    count: schemes.length,
    schemes
  });
});

export const getSchemeById = asyncHandler(async (req, res) => {
  const scheme = await Scheme.findOne({ _id: req.params.id, schoolId: req.schoolId }).lean();
  if (!scheme) return sendError(res, 'Scheme not found', 404);

  return sendSuccess(res, 'Scheme fetched successfully', scheme);
});

export const getEligibleSchemes = asyncHandler(async (req, res) => {
  const { studentUID } = req.params;

  if (req.user.role === 'student' && req.user.linkedStudentUID !== studentUID) {
    return sendError(res, 'Students can only check eligibility for their own record', 403);
  }

  const result = await findEligibleSchemesForStudent({
    studentUID,
    schoolId: req.schoolId
  });

  return sendSuccess(res, 'Eligible schemes fetched successfully', {
    studentUID: result.studentUID,
    academicScore: result.academicScore,
    spi: result.spi,
    eligibleSchemes: result.eligibleSchemes
  });
});
