import { Router } from 'express';
import {
  addParticipationRecord,
  approveParticipationRecord,
  getStudentParticipation
} from '../controllers/participationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles, authorizeStudentSelfOrRoles } from '../middleware/rbacMiddleware.js';

const router = Router();

router.use(protect);

router.post('/', authorizeRoles('teacher'), addParticipationRecord);
router.put('/approve/:id', authorizeRoles('teacher'), approveParticipationRecord);
router.get('/student/:uid', authorizeStudentSelfOrRoles(['admin', 'teacher']), getStudentParticipation);

export default router;
