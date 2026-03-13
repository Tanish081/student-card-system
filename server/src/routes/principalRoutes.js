import { Router } from 'express';
import {
	getPrincipalAnalytics,
	getPrincipalSPI,
	getPrincipalTopStudents
} from '../controllers/principalController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';

const router = Router();

router.use(protect);

router.get('/analytics', authorizeRoles('principal'), getPrincipalAnalytics);
router.get('/spi', authorizeRoles('principal'), getPrincipalSPI);
router.get('/top-students', authorizeRoles('principal'), getPrincipalTopStudents);

export default router;
