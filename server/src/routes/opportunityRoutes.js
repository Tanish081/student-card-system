import { Router } from 'express';
import {
  applyToOpportunity,
  bulkUpdateOpportunityApplicationStatus,
  createOpportunity,
  deleteOpportunity,
  getOpportunityApplications,
  getOpportunityById,
  getOpportunitiesForReview,
  getOpportunityFeed,
  updateOpportunityApplicationStatus,
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
router.get('/', authorizeRoles('teacher', 'admin', 'principal'), getOpportunitiesForReview);
router.get('/feed', authorizeRoles('student'), getOpportunityFeed);
router.post('/:id/apply', authorizeRoles('student'), applyToOpportunity);
router.get('/:id/applications', authorizeRoles('teacher', 'admin', 'principal'), getOpportunityApplications);
router.patch(
  '/:id/applications/:applicationId/status',
  authorizeRoles('teacher', 'admin', 'principal'),
  updateOpportunityApplicationStatus
);
router.patch(
  '/:id/applications/status/bulk',
  authorizeRoles('teacher', 'admin', 'principal'),
  bulkUpdateOpportunityApplicationStatus
);
router.get('/:id', authorizeRoles('teacher', 'admin', 'principal', 'student'), getOpportunityById);
router.put(
  '/:id',
  authorizeRoles('teacher', 'admin', 'principal'),
  uploadOpportunityAttachments,
  updateOpportunity
);
router.delete('/:id', authorizeRoles('admin'), deleteOpportunity);

export default router;
