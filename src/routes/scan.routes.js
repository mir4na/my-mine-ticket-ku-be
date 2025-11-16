// src/routes/scan.routes.js
import { Router } from 'express';
import { scanController } from '../controllers/scan.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/download-package/:eventId', authenticate, authorize('EO'), scanController.downloadOfflinePackage);
router.post('/scan', scanController.scanTicket);
router.post('/upload-logs', authenticate, authorize('EO'), scanController.uploadScanLogs);

export default router;
