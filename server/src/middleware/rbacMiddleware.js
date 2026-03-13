import { sendError } from '../utils/apiResponse.js';

export const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return sendError(res, 'Unauthorized user context', 401);
  }

  if (!allowedRoles.includes(req.user.role)) {
    return sendError(res, 'Forbidden: insufficient permissions', 403);
  }

  return next();
};

export const authorizeStudentSelfOrRoles = (allowedRoles = []) => (req, res, next) => {
  if (!req.user) {
    return sendError(res, 'Unauthorized user context', 401);
  }

  if (allowedRoles.includes(req.user.role)) {
    return next();
  }

  if (req.user.role === 'student' && req.user.linkedStudentUID === req.params.uid) {
    return next();
  }

  return sendError(res, 'Forbidden: access denied for this student record', 403);
};
