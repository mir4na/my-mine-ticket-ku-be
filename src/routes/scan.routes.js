import { Router } from 'express';
import { scanController } from '../controllers/scan.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/scan', scanController.scanTicket);
router.get('/logs/:eventId', authenticate, authorize('EO'), scanController.getScanLogs);

export default router;