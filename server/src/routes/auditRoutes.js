import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';

const router = Router();

router.use(protect, authorizeRoles('admin', 'principal'));

router.get('/logs', getAuditLogs);

export default router;
