import { Router } from 'express';
import {
  assignTeacherRole,
  bulkUpdateAchievementStatus,
  createStudentAccount,
  createTeacherAccount,
  getAchievementsSection,
  getAuditLogsSection,
  getOpportunitiesSection,
  getOverviewRecentActivity,
  getOverviewStats,
  getSchemeEligibilitySection,
  getSchoolsSection,
  getStudentSectionDetail,
  getStudentsSection,
  removeTeacherRole,
  getStudents,
  getTeachers,
  updateAchievementStatus
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

router.get('/overview-stats', getOverviewStats);
router.get('/overview-activity', getOverviewRecentActivity);
router.get('/sections/students', getStudentsSection);
router.get('/sections/students/:uid', getStudentSectionDetail);
router.get('/sections/schools', getSchoolsSection);
router.get('/sections/achievements', getAchievementsSection);
router.patch('/sections/achievements/:achievementId/status', updateAchievementStatus);
router.patch('/sections/achievements/status/bulk', bulkUpdateAchievementStatus);
router.get('/sections/opportunities', getOpportunitiesSection);
router.get('/sections/schemes', getSchemeEligibilitySection);
router.get('/sections/audit', getAuditLogsSection);

export default router;
