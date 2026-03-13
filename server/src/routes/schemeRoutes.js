import { Router } from 'express';
import {
  createScheme,
  getEligibleSchemes,
  getSchemeById,
  getSchemes
} from '../controllers/schemeController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';

const router = Router();

router.use(protect);

router.get('/eligible/:studentUID', authorizeRoles('admin', 'principal', 'teacher', 'student'), getEligibleSchemes);
router.get('/', authorizeRoles('admin', 'principal', 'teacher', 'student'), getSchemes);
router.get('/:id', authorizeRoles('admin', 'principal', 'teacher', 'student'), getSchemeById);
router.post('/', authorizeRoles('admin'), createScheme);

export default router;
