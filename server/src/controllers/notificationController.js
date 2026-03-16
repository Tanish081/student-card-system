import Notification from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendError, sendSuccess } from '../utils/apiResponse.js';

export const getMyNotifications = asyncHandler(async (req, res) => {
  if (req.user.role !== 'student') {
    return sendError(res, 'Only students can access notifications', 403);
  }

  const studentUID = req.user.linkedStudentUID;
  if (!studentUID) {
    return sendError(res, 'Student account is not linked to a student UID', 400);
  }

  const schoolId = req.schoolId;
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));

  const notifications = await Notification.find({ schoolId, studentUID })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const unreadCount = await Notification.countDocuments({ schoolId, studentUID, isRead: false });

  return sendSuccess(res, 'Notifications fetched successfully', {
    unreadCount,
    count: notifications.length,
    notifications
  });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  if (req.user.role !== 'student') {
    return sendError(res, 'Only students can update notifications', 403);
  }

  const studentUID = req.user.linkedStudentUID;
  const schoolId = req.schoolId;
  const { id } = req.params;

  const notification = await Notification.findOneAndUpdate(
    { _id: id, schoolId, studentUID },
    { $set: { isRead: true } },
    { new: true }
  ).lean();

  if (!notification) return sendError(res, 'Notification not found', 404);

  return sendSuccess(res, 'Notification marked as read', notification);
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  if (req.user.role !== 'student') {
    return sendError(res, 'Only students can update notifications', 403);
  }

  const studentUID = req.user.linkedStudentUID;
  const schoolId = req.schoolId;

  const result = await Notification.updateMany(
    { schoolId, studentUID, isRead: false },
    { $set: { isRead: true } }
  );

  return sendSuccess(res, 'All notifications marked as read', {
    updatedCount: result.modifiedCount || 0
  });
});
