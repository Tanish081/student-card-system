import { Router } from 'express';
import {
  createStudent,
  getStudentDashboard,
  getStudentEligibility,
  getStudentProfile,
  getStudents
} from '../controllers/studentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles, authorizeStudentSelfOrRoles } from '../middleware/rbacMiddleware.js';

const router = Router();

router.use(protect);

router.get('/', authorizeRoles('admin', 'teacher'), getStudents);
router.post('/', authorizeRoles('admin'), createStudent);
router.get('/:uid', authorizeStudentSelfOrRoles(['admin', 'teacher']), getStudentProfile);
router.get('/:uid/dashboard', authorizeStudentSelfOrRoles(['admin', 'teacher']), getStudentDashboard);
router.get('/:uid/eligibility', authorizeStudentSelfOrRoles(['admin', 'teacher']), getStudentEligibility);

export default router;
