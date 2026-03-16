import AuditLog from '../models/AuditLog.js';
import crypto from 'crypto';

const stableStringify = (value) => {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  const keys = Object.keys(value).sort();
  const pairs = keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`);
  return `{${pairs.join(',')}}`;
};

const buildAuditHash = ({ previousHash, payload }) => {
  const input = `${String(previousHash || '')}|${stableStringify(payload)}`;
  return crypto.createHash('sha256').update(input).digest('hex');
};

export const logAuditAction = async ({
  req,
  action,
  entityType,
  entityId,
  metadata = {},
  beforeState = null,
  afterState = null,
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

  const previousLog = await AuditLog.findOne({ schoolId: resolvedSchoolId })
    .sort({ eventTimestamp: -1, _id: -1 })
    .select('currentHash')
    .lean();

  const eventTimestamp = new Date();
  const payload = {
    schoolId: resolvedSchoolId,
    action,
    entityType,
    entityId: String(entityId),
    performedByUserId: String(resolvedActor.id),
    performedByRole: String(resolvedActor.role),
    performedByName: String(resolvedActor.name),
    metadata,
    beforeState,
    afterState,
    eventTimestamp: eventTimestamp.toISOString()
  };

  const previousHash = previousLog?.currentHash || null;
  const currentHash = buildAuditHash({ previousHash, payload });

  return AuditLog.create({
    ...payload,
    previousHash,
    currentHash,
    eventTimestamp
  });
};
