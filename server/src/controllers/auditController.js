import AuditLog from '../models/AuditLog.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const getAuditLogs = asyncHandler(async (req, res) => {
  const schoolId = req.schoolId;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));

  const query = { schoolId };
  if (req.query.action) query.action = String(req.query.action);
  if (req.query.entityType) query.entityType = String(req.query.entityType);
  if (req.query.entityId) query.entityId = String(req.query.entityId);

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .sort({ eventTimestamp: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(query)
  ]);

  return sendSuccess(res, 'Audit logs fetched successfully', {
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    count: logs.length,
    logs
  });
});
