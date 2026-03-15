import { Router } from 'express';
import {
  applyToOpportunity,
  createOpportunity,
  deleteOpportunity,
  getOpportunityApplications,
  getOpportunityById,
  getOpportunityFeed,
  updateOpportunity
} from '../controllers/opportunityController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';
import { uploadOpportunityAttachments } from '../middleware/uploadMiddleware.js';

const router = Router();

router.use(protect);

router.post(
  '/',
  authorizeRoles('teacher', 'admin', 'principal'),
  uploadOpportunityAttachments,
  createOpportunity
);
router.get('/feed', authorizeRoles('student'), getOpportunityFeed);
router.post('/:id/apply', authorizeRoles('student'), applyToOpportunity);
router.get('/:id/applications', authorizeRoles('teacher', 'admin', 'principal'), getOpportunityApplications);
router.get('/:id', authorizeRoles('teacher', 'admin', 'principal', 'student'), getOpportunityById);
router.put(
  '/:id',
  authorizeRoles('teacher', 'admin', 'principal'),
  uploadOpportunityAttachments,
  updateOpportunity
);
router.delete('/:id', authorizeRoles('admin'), deleteOpportunity);

export default router;
