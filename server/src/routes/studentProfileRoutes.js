import { Router } from 'express';
import { completeStudentProfile } from '../controllers/studentProfileController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';

const router = Router();

router.post('/complete-profile', protect, authorizeRoles('student'), completeStudentProfile);

export default router;
