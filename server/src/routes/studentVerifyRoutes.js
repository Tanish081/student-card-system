import { Router } from 'express';
import { getPublicStudentVerification } from '../controllers/publicController.js';
import { publicVerifyLimiter } from '../middleware/rateLimitMiddleware.js';

const router = Router();

router.get('/verify/:uid', publicVerifyLimiter, getPublicStudentVerification);

export default router;
