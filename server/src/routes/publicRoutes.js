import { Router } from 'express';
import { getPublicStudentVerification } from '../controllers/publicController.js';

const router = Router();

router.get('/student/:uid', getPublicStudentVerification);

export default router;
