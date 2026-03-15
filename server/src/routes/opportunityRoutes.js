import { Router } from 'express';
import {
  createOpportunity,
  deleteOpportunity,
  getOpportunityById,
  getOpportunityFeed,
  updateOpportunity
} from '../controllers/opportunityController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';

const router = Router();

router.use(protect);

router.post('/', authorizeRoles('teacher', 'admin', 'principal'), createOpportunity);
router.get('/feed', authorizeRoles('student'), getOpportunityFeed);
router.get('/:id', authorizeRoles('teacher', 'admin', 'principal', 'student'), getOpportunityById);
router.put('/:id', authorizeRoles('teacher', 'admin', 'principal'), updateOpportunity);
router.delete('/:id', authorizeRoles('admin'), deleteOpportunity);

export default router;
