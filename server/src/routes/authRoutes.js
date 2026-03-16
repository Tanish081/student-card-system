import { Router } from 'express';
import { getMe, login, register } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';

const router = Router();

router.post('/register', protect, authorizeRoles('admin'), register);
router.post('/login', login);
router.get('/me', protect, getMe);

export default router;
