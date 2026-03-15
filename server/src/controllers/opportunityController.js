import mongoose from 'mongoose';
import Opportunity, { CATEGORIES, EVENT_TYPES } from '../models/Opportunity.js';
import OpportunityApplication from '../models/OpportunityApplication.js';
import Student from '../models/Student.js';
import TeacherRole from '../models/TeacherRole.js';
import { TEACHER_SUB_ROLES } from '../config/constants.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendError, sendSuccess } from '../utils/apiResponse.js';
import {
  buildStudentOpportunityContext,
  expireOutdatedOpportunities,
  scoreOpportunityForStudent
} from '../services/opportunityScoringService.js';
import { logAuditAction } from '../services/auditService.js';
import { computeStudentSPI } from '../services/spiService.js';

const normalizeArray = (value = []) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeClassValues = (values = []) =>
  normalizeArray(values).map((item) => String(item).toUpperCase());

const normalizeSkillTags = (values = []) =>
  normalizeArray(values).map((item) => String(item).toLowerCase());

const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);

const MAX_ATTACHMENT_SIZE_KB = 4096;

const estimateDataUrlSizeKB = (dataUrl = '') => {
  const encoded = String(dataUrl).split(',')[1] || '';
  const bytes = Math.floor((encoded.length * 3) / 4);
  return Math.round(bytes / 1024);
};

const toAbsoluteFileUrl = (req, relativePath) => {
  if (!relativePath) return null;
  if (/^https?:\/\//i.test(relativePath)) return relativePath;

  const forwardedProto = req.headers['x-forwarded-proto'];
  const protocol = forwardedProto || req.protocol || 'https';
  const host = req.get('host');
  if (!host) return relativePath;
  return `${protocol}://${host}${relativePath}`;
};

const sanitizeAttachments = (attachments = []) => {
  const normalized = Array.isArray(attachments) ? attachments : [attachments];

  return normalized.map((item, index) => {
    const fileName = String(item?.fileName || '').trim();
    const mimeType = String(item?.mimeType || '').trim().toLowerCase();
    const dataUrl = item?.dataUrl ? String(item.dataUrl) : null;
    const fileUrl = item?.fileUrl ? String(item.fileUrl) : null;
    const sizeKB = Number(item?.sizeKB || estimateDataUrlSizeKB(dataUrl || ''));

    if (!fileName || !mimeType || (!dataUrl && !fileUrl)) {
      const error = new Error(
        `attachments[${index}] is missing fileName, mimeType, and file payload`
      );
      error.statusCode = 400;
      throw error;
    }

    if (!ALLOWED_ATTACHMENT_MIME_TYPES.has(mimeType)) {
      const error = new Error(`Unsupported attachment type: ${mimeType}`);
      error.statusCode = 400;
      throw error;
    }

    if (dataUrl && !dataUrl.startsWith(`data:${mimeType};base64,`)) {
      const error = new Error(`attachments[${index}] dataUrl format is invalid`);
      error.statusCode = 400;
      throw error;
    }

    if (sizeKB > MAX_ATTACHMENT_SIZE_KB) {
      const error = new Error(`Attachment ${fileName} exceeds ${MAX_ATTACHMENT_SIZE_KB} KB`);
      error.statusCode = 400;
      throw error;
    }

    return {
      fileName,
      mimeType,
      fileUrl,
      dataUrl,
      sizeKB
    };
  });
};

const fileToAttachmentMetadata = (files = []) =>
  files.map((file) => ({
    fileName: file.originalname,
    mimeType: file.mimetype,
    fileUrl: `/uploads/opportunities/${file.filename}`,
    dataUrl: null,
    sizeKB: Math.round((Number(file.size || 0) / 1024) * 100) / 100
  }));

const sanitizeOpportunityPayload = (payload, { isCreate = false } = {}) => {
  const next = {};

  if (payload.title !== undefined) next.title = String(payload.title).trim();
  if (payload.description !== undefined) next.description = String(payload.description).trim();

  if (payload.eventType !== undefined) next.eventType = String(payload.eventType).trim().toLowerCase();
  if (payload.category !== undefined) next.category = String(payload.category).trim().toLowerCase();

  if (payload.skillTags !== undefined) next.skillTags = normalizeSkillTags(payload.skillTags);
  if (payload.attachments !== undefined) next.attachments = sanitizeAttachments(payload.attachments);
  if (payload.eligibleClasses !== undefined) {
    next.eligibleClasses = normalizeClassValues(payload.eligibleClasses);
  }

  if (payload.minSPI !== undefined) next.minSPI = Number(payload.minSPI);

  if (payload.deadline !== undefined) {
    const date = new Date(payload.deadline);
    if (Number.isNaN(date.getTime())) {
      const error = new Error('deadline must be a valid date');
      error.statusCode = 400;
      throw error;
    }
    if (date.getTime() <= Date.now()) {
      const error = new Error('deadline must be a future date');
      error.statusCode = 400;
      throw error;
    }
    next.deadline = date;
  }

  if (isCreate) {
    const required = ['title', 'description', 'eventType', 'category', 'eligibleClasses', 'deadline'];
    const missing = required.filter((field) => {
      if (next[field] === undefined) return true;
      if (Array.isArray(next[field])) return next[field].length === 0;
      return String(next[field]).trim().length === 0;
    });

    if (missing.length) {
      const error = new Error(`Missing required fields: ${missing.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }
  }

  if (next.eventType && !EVENT_TYPES.includes(next.eventType)) {
    const error = new Error(`eventType must be one of: ${EVENT_TYPES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  if (next.category && !CATEGORIES.includes(next.category)) {
    const error = new Error(`category must be one of: ${CATEGORIES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  if (next.minSPI !== undefined && (Number.isNaN(next.minSPI) || next.minSPI < 0 || next.minSPI > 100)) {
    const error = new Error('minSPI must be between 0 and 100');
    error.statusCode = 400;
    throw error;
  }

  return next;
};

const enforceTeacherOpportunityScope = async ({ req, payload, schoolId }) => {
  if (req.user.role !== 'teacher') return;

  if (payload.eventType === 'scholarship') {
    const error = new Error('Teachers cannot post scholarships. Use admin or principal account.');
    error.statusCode = 403;
    throw error;
  }

  const isSportsOpportunity = payload.eventType === 'sports' || payload.category === 'sports';
  if (!isSportsOpportunity) return;

  if (!req.user.linkedTeacherID) {
    const error = new Error('Teacher account is not linked to teacherID');
    error.statusCode = 400;
    throw error;
  }

  const roles = await TeacherRole.find({
    schoolId,
    teacherID: req.user.linkedTeacherID
  }).lean();

  const isSportsTeacher = roles.some((entry) => entry.role === TEACHER_SUB_ROLES.SPORTS_TEACHER);
  if (!isSportsTeacher) {
    const error = new Error('Only Sports Teacher can post sports opportunities');
    error.statusCode = 403;
    throw error;
  }
};

const formatOpportunityOutput = (opportunity, req, enrichments = {}) => ({
  id: opportunity._id,
  title: opportunity.title,
  description: opportunity.description,
  eventType: opportunity.eventType,
  category: opportunity.category,
  skillTags: opportunity.skillTags || [],
  attachments: (opportunity.attachments || []).map((item) => ({
    fileName: item.fileName,
    mimeType: item.mimeType,
    fileUrl: item.fileUrl ? toAbsoluteFileUrl(req, item.fileUrl) : null,
    dataUrl: item.dataUrl || null,
    sizeKB: item.sizeKB || 0
  })),
  eligibleClasses: opportunity.eligibleClasses || [],
  minSPI: opportunity.minSPI,
  postedBy: opportunity.postedBy,
  postedByName: opportunity.postedByName,
  role: opportunity.role,
  deadline: opportunity.deadline,
  status: opportunity.status,
  createdAt: opportunity.createdAt,
  ...enrichments
});

export const createOpportunity = asyncHandler(async (req, res) => {
  const schoolId = req.schoolId;
  const incomingAttachments = req.files?.length
    ? fileToAttachmentMetadata(req.files)
    : req.body.attachments;

  const payload = sanitizeOpportunityPayload(
    {
      ...req.body,
      attachments: incomingAttachments
    },
    { isCreate: true }
  );

  await enforceTeacherOpportunityScope({ req, payload, schoolId });

  const opportunity = await Opportunity.create({
    schoolId,
    ...payload,
    postedBy: req.user._id,
    postedByName: req.user.name,
    role: req.user.role,
    status: 'active'
  });

  await logAuditAction({
    req,
    action: 'opportunity-created',
    entityType: 'Opportunity',
    entityId: opportunity._id,
    metadata: {
      title: opportunity.title,
      category: opportunity.category,
      eventType: opportunity.eventType
    }
  });

  return sendSuccess(res, 'Opportunity created successfully', formatOpportunityOutput(opportunity, req), 201);
});

export const getOpportunityFeed = asyncHandler(async (req, res) => {
  if (req.user.role !== 'student') {
    return sendError(res, 'Only students can view personalized opportunity feed', 403);
  }

  const schoolId = req.schoolId;
  await expireOutdatedOpportunities(schoolId);

  const studentUID = req.user.linkedStudentUID;
  if (!studentUID) {
    return sendError(res, 'Student account is not linked to a student UID', 400);
  }

  const student = await Student.findOne({ schoolId, uid: studentUID }).lean();
  if (!student) return sendError(res, 'Student record not found', 404);

  const opportunities = await Opportunity.find({
    schoolId,
    status: 'active',
    deadline: { $gte: new Date() },
    eligibleClasses: String(student.class).toUpperCase()
  })
    .sort({ deadline: 1, createdAt: -1 })
    .lean();

  const context = await buildStudentOpportunityContext({ student, schoolId });

  const scored = opportunities
    .map((item) => {
      const score = scoreOpportunityForStudent({
        opportunity: item,
        context
      });

      return formatOpportunityOutput(item, req, {
        relevanceScore: score.relevanceScore,
        successProbability: score.successProbability
      });
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  const opportunityIds = scored.map((item) => item.id);
  const myApplications = await OpportunityApplication.find({
    schoolId,
    studentUID,
    opportunityId: { $in: opportunityIds }
  })
    .select('opportunityId status')
    .lean();

  const appMap = new Map(
    myApplications.map((item) => [String(item.opportunityId), item.status])
  );

  const enriched = scored.map((item) => ({
    ...item,
    hasApplied: appMap.has(String(item.id)),
    applicationStatus: appMap.get(String(item.id)) || null
  }));

  return sendSuccess(res, 'Opportunity feed fetched successfully', {
    count: enriched.length,
    opportunities: enriched
  });
});

export const getOpportunityById = asyncHandler(async (req, res) => {
  const schoolId = req.schoolId;
  await expireOutdatedOpportunities(schoolId);

  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendError(res, 'Invalid opportunity id', 400);
  }

  const opportunity = await Opportunity.findOne({
    _id: req.params.id,
    schoolId
  }).lean();

  if (!opportunity) return sendError(res, 'Opportunity not found', 404);

  if (req.user.role !== 'student') {
    return sendSuccess(res, 'Opportunity fetched successfully', formatOpportunityOutput(opportunity, req));
  }

  const studentUID = req.user.linkedStudentUID;
  if (!studentUID) {
    return sendError(res, 'Student account is not linked to a student UID', 400);
  }

  const student = await Student.findOne({ schoolId, uid: studentUID }).lean();
  if (!student) return sendError(res, 'Student record not found', 404);

  const context = await buildStudentOpportunityContext({ student, schoolId });
  const score = scoreOpportunityForStudent({
    opportunity,
    context
  });

  const application = await OpportunityApplication.findOne({
    schoolId,
    opportunityId: opportunity._id,
    studentUID
  })
    .select('status')
    .lean();

  return sendSuccess(res, 'Opportunity fetched successfully',
    formatOpportunityOutput(opportunity, req, {
      relevanceScore: score.relevanceScore,
      successProbability: score.successProbability,
      scoreBreakdown: score.metrics,
      hasApplied: Boolean(application),
      applicationStatus: application?.status || null
    })
  );
});

export const updateOpportunity = asyncHandler(async (req, res) => {
  const schoolId = req.schoolId;

  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendError(res, 'Invalid opportunity id', 400);
  }

  const opportunity = await Opportunity.findOne({
    _id: req.params.id,
    schoolId
  });

  if (!opportunity) return sendError(res, 'Opportunity not found', 404);

  const isCreator = String(opportunity.postedBy) === String(req.user._id);
  if (!isCreator && req.user.role !== 'admin') {
    return sendError(res, 'Only creator or admin can update this opportunity', 403);
  }

  const incomingAttachments = req.files?.length
    ? fileToAttachmentMetadata(req.files)
    : req.body.attachments;

  const payload = sanitizeOpportunityPayload({
    ...req.body,
    ...(incomingAttachments !== undefined ? { attachments: incomingAttachments } : {})
  });
  const merged = {
    eventType: payload.eventType ?? opportunity.eventType,
    category: payload.category ?? opportunity.category
  };

  await enforceTeacherOpportunityScope({ req, payload: merged, schoolId });

  Object.entries(payload).forEach(([key, value]) => {
    opportunity[key] = value;
  });

  await opportunity.save();

  await logAuditAction({
    req,
    action: 'opportunity-updated',
    entityType: 'Opportunity',
    entityId: opportunity._id,
    metadata: {
      title: opportunity.title,
      category: opportunity.category,
      eventType: opportunity.eventType
    }
  });

  return sendSuccess(res, 'Opportunity updated successfully', formatOpportunityOutput(opportunity, req));
});

export const deleteOpportunity = asyncHandler(async (req, res) => {
  const schoolId = req.schoolId;

  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendError(res, 'Invalid opportunity id', 400);
  }

  const opportunity = await Opportunity.findOneAndDelete({
    _id: req.params.id,
    schoolId
  });

  if (!opportunity) return sendError(res, 'Opportunity not found', 404);

  await logAuditAction({
    req,
    action: 'opportunity-deleted',
    entityType: 'Opportunity',
    entityId: opportunity._id,
    metadata: {
      title: opportunity.title,
      category: opportunity.category,
      eventType: opportunity.eventType
    }
  });

  return sendSuccess(res, 'Opportunity deleted successfully', {
    id: opportunity._id
  });
});

export const applyToOpportunity = asyncHandler(async (req, res) => {
  if (req.user.role !== 'student') {
    return sendError(res, 'Only students can apply to opportunities', 403);
  }

  const schoolId = req.schoolId;
  await expireOutdatedOpportunities(schoolId);

  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendError(res, 'Invalid opportunity id', 400);
  }

  const studentUID = req.user.linkedStudentUID;
  if (!studentUID) {
    return sendError(res, 'Student account is not linked to a student UID', 400);
  }

  const [student, opportunity] = await Promise.all([
    Student.findOne({ schoolId, uid: studentUID }).lean(),
    Opportunity.findOne({
      _id: req.params.id,
      schoolId,
      status: 'active',
      deadline: { $gte: new Date() }
    }).lean()
  ]);

  if (!student) return sendError(res, 'Student record not found', 404);
  if (!opportunity) return sendError(res, 'Opportunity not found or expired', 404);

  if (!(opportunity.eligibleClasses || []).includes(String(student.class).toUpperCase())) {
    return sendError(res, 'Student class is not eligible for this opportunity', 403);
  }

  const spi = await computeStudentSPI(studentUID, schoolId);
  if (Number(spi.spi) < Number(opportunity.minSPI || 0)) {
    return sendError(res, 'Student SPI is below the minimum requirement', 403);
  }

  const context = await buildStudentOpportunityContext({ student, schoolId });
  const score = scoreOpportunityForStudent({ opportunity, context });

  const application = await OpportunityApplication.findOneAndUpdate(
    {
      schoolId,
      opportunityId: opportunity._id,
      studentUID
    },
    {
      $setOnInsert: {
        studentUserId: req.user._id,
        status: 'applied',
        relevanceScoreSnapshot: score.relevanceScore,
        successProbabilitySnapshot: score.successProbability
      }
    },
    {
      new: true,
      upsert: true
    }
  );

  await logAuditAction({
    req,
    action: 'opportunity-applied',
    entityType: 'OpportunityApplication',
    entityId: application._id,
    metadata: {
      opportunityId: opportunity._id,
      studentUID
    }
  });

  return sendSuccess(res, 'Applied to opportunity successfully', {
    id: application._id,
    opportunityId: application.opportunityId,
    status: application.status,
    relevanceScore: application.relevanceScoreSnapshot,
    successProbability: application.successProbabilitySnapshot
  }, 201);
});

export const getOpportunityApplications = asyncHandler(async (req, res) => {
  const schoolId = req.schoolId;

  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendError(res, 'Invalid opportunity id', 400);
  }

  const opportunity = await Opportunity.findOne({
    _id: req.params.id,
    schoolId
  })
    .select('postedBy title')
    .lean();

  if (!opportunity) return sendError(res, 'Opportunity not found', 404);

  if (req.user.role === 'teacher' && String(opportunity.postedBy) !== String(req.user._id)) {
    return sendError(res, 'Teachers can only view applications for their own opportunities', 403);
  }

  const applications = await OpportunityApplication.find({
    schoolId,
    opportunityId: opportunity._id
  })
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(res, 'Opportunity applications fetched successfully', {
    opportunityId: opportunity._id,
    title: opportunity.title,
    count: applications.length,
    applications
  });
});
