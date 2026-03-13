import AuditLog from '../models/AuditLog.js';

export const logAuditAction = async ({
  req,
  action,
  entityType,
  entityId,
  metadata = {},
  schoolId,
  actor
}) => {
  const resolvedActor = actor ||
    (req?.user
      ? {
          id: req.user._id,
          role: req.user.role,
          name: req.user.name
        }
      : {
          id: 'system',
          role: 'system',
          name: 'System'
        });

  const resolvedSchoolId = schoolId || req?.schoolId || process.env.DEFAULT_SCHOOL_ID || 'SCH001';

  return AuditLog.create({
    schoolId: resolvedSchoolId,
    action,
    entityType,
    entityId: String(entityId),
    performedByUserId: String(resolvedActor.id),
    performedByRole: String(resolvedActor.role),
    performedByName: String(resolvedActor.name),
    metadata
  });
};
