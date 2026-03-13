import { Router } from 'express';
import {
  addAcademicRecord,
  addGuidance,
  getMyAssignments,
  getMyStudents,
  getTeacherRoleMappings,
  getStudentAcademicRecords,
  updateAcademicRecord
} from '../controllers/teacherController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles, authorizeStudentSelfOrRoles } from '../middleware/rbacMiddleware.js';

const router = Router();

router.use(protect);

router.get('/me/assignments', authorizeRoles('teacher'), getMyAssignments);
router.get('/me/students', authorizeRoles('teacher'), getMyStudents);
router.get('/roles/:teacherID', authorizeRoles('admin', 'teacher'), getTeacherRoleMappings);
router.post('/academic-records', authorizeRoles('teacher'), addAcademicRecord);
router.patch('/academic-records/:recordId', authorizeRoles('teacher'), updateAcademicRecord);
router.get(
  '/academic-records/student/:uid',
  authorizeStudentSelfOrRoles(['admin', 'teacher']),
  getStudentAcademicRecords
);
router.post('/guidance', authorizeRoles('teacher'), addGuidance);

export default router;
