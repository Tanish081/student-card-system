import Notification from '../models/Notification.js';

export const createNotification = async ({
  schoolId,
  studentUID,
  type = 'general',
  title,
  message,
  entityType = null,
  entityId = null
}) => {
  if (!schoolId || !studentUID || !title || !message) return null;

  return Notification.create({
    schoolId,
    studentUID,
    type,
    title,
    message,
    entityType,
    entityId: entityId ? String(entityId) : null
  });
};

export const createOpportunityStatusNotification = async ({
  schoolId,
  studentUID,
  opportunity,
  status
}) => {
  const title = `Opportunity Application ${String(status || '').toUpperCase()}`;
  const eventTitle = opportunity?.title || 'Opportunity';
  const message = `Your application for \"${eventTitle}\" is now marked as \"${status}\".`;

  return createNotification({
    schoolId,
    studentUID,
    type: 'opportunity-status',
    title,
    message,
    entityType: 'OpportunityApplication',
    entityId: opportunity?._id
  });
};
