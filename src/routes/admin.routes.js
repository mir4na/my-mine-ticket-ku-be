import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/stats', authenticate, authorize('SUPERADMIN'), adminController.getPlatformStats);
router.post('/config', authenticate, authorize('SUPERADMIN'), adminController.updatePlatformConfig);
router.get('/revenue-report/:eventId', authenticate, authorize('SUPERADMIN', 'EO'), adminController.getRevenueReport);

router.post('/withdrawal/receiver', authenticate, authorize('SUPERADMIN'), adminController.processReceiverWithdrawal);
router.post('/withdrawal/tax', authenticate, authorize('SUPERADMIN'), adminController.processTaxWithdrawal);
router.post('/withdrawal/platform', authenticate, authorize('SUPERADMIN'), adminController.processPlatformWithdrawal);

export default router;