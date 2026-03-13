import { Router } from 'express';
import {
  assignTeacherRole,
  createStudentAccount,
  createTeacherAccount,
  removeTeacherRole,
  getStudents,
  getTeachers
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';

const router = Router();

router.use(protect, authorizeRoles('admin'));

router.post('/create-teacher', createTeacherAccount);
router.post('/create-student', createStudentAccount);
router.put('/assign-teacher-role', assignTeacherRole);
router.delete('/teacher-role/:mappingId', removeTeacherRole);
router.get('/teachers', getTeachers);
router.get('/students', getStudents);

export default router;
