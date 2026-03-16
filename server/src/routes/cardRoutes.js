import { Router } from 'express';
import {
	downloadStudentCard,
	getDigiLockerExportStub,
	getStudentQrCode
} from '../controllers/cardController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';

const router = Router();

router.use(protect, authorizeRoles('admin', 'principal', 'teacher', 'student'));

router.get('/:uid/card', downloadStudentCard);
router.get('/:uid/qrcode', getStudentQrCode);
router.get('/:uid/digilocker-export', getDigiLockerExportStub);

export default router;
