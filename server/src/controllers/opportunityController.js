import mongoose from 'mongoose';
import Opportunity, { CATEGORIES, EVENT_TYPES } from '../models/Opportunity.js';
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

const sanitizeOpportunityPayload = (payload, { isCreate = false } = {}) => {
  const next = {};

  if (payload.title !== undefined) next.title = String(payload.title).trim();
  if (payload.description !== undefined) next.description = String(payload.description).trim();

  if (payload.eventType !== undefined) next.eventType = String(payload.eventType).trim().toLowerCase();
  if (payload.category !== undefined) next.category = String(payload.category).trim().toLowerCase();

  if (payload.skillTags !== undefined) next.skillTags = normalizeSkillTags(payload.skillTags);
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

const formatOpportunityOutput = (opportunity, enrichments = {}) => ({
  id: opportunity._id,
  title: opportunity.title,
  description: opportunity.description,
  eventType: opportunity.eventType,
  category: opportunity.category,
  skillTags: opportunity.skillTags || [],
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
  const payload = sanitizeOpportunityPayload(req.body, { isCreate: true });

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

  return sendSuccess(res, 'Opportunity created successfully', formatOpportunityOutput(opportunity), 201);
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

      return formatOpportunityOutput(item, {
        relevanceScore: score.relevanceScore,
        successProbability: score.successProbability
      });
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  return sendSuccess(res, 'Opportunity feed fetched successfully', {
    count: scored.length,
    opportunities: scored
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
    return sendSuccess(res, 'Opportunity fetched successfully', formatOpportunityOutput(opportunity));
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

  return sendSuccess(res, 'Opportunity fetched successfully',
    formatOpportunityOutput(opportunity, {
      relevanceScore: score.relevanceScore,
      successProbability: score.successProbability,
      scoreBreakdown: score.metrics
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

  const payload = sanitizeOpportunityPayload(req.body);
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

  return sendSuccess(res, 'Opportunity updated successfully', formatOpportunityOutput(opportunity));
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
