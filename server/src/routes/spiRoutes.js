import { Router } from 'express';
import { getClassSPIRanking, getStudentSPI } from '../controllers/spiController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles, authorizeStudentSelfOrRoles } from '../middleware/rbacMiddleware.js';

const router = Router();

router.use(protect);

router.get('/student/:uid', authorizeStudentSelfOrRoles(['admin', 'teacher']), getStudentSPI);
router.get('/class/:classId', authorizeRoles('teacher'), getClassSPIRanking);

export default router;
