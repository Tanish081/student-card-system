import { Router } from 'express';
import {
  addAchievement,
  getStudentAchievements,
  verifyAchievement
} from '../controllers/achievementController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles, authorizeStudentSelfOrRoles } from '../middleware/rbacMiddleware.js';

const router = Router();

router.use(protect);

router.post('/', authorizeRoles('teacher'), addAchievement);
router.patch('/:achievementId/verify', authorizeRoles('teacher'), verifyAchievement);
router.get('/student/:uid', authorizeStudentSelfOrRoles(['admin', 'teacher']), getStudentAchievements);

export default router;
