import { Router } from 'express';
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';

const router = Router();

router.use(protect, authorizeRoles('student'));

router.get('/me', getMyNotifications);
router.patch('/me/read-all', markAllNotificationsRead);
router.patch('/me/:id/read', markNotificationRead);

export default router;
