// src/routes/admin.routes.js
import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/stats', authenticate, authorize('SUPERADMIN'), adminController.getPlatformStats);
router.post('/config', authenticate, authorize('SUPERADMIN'), adminController.updatePlatformConfig);
router.get('/revenue-report/:eventId', authenticate, authorize('SUPERADMIN', 'EO'), adminController.getRevenueReport);
router.post('/withdrawal', authenticate, authorize('SUPERADMIN'), adminController.processWithdrawal);

export default router;
