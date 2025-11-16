import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { userController } from '../controllers/user.controller.js';

const router = Router();

router.get('/tickets', authenticate, userController.getMyTickets);
router.get('/transactions', authenticate, userController.getMyTransactions);
router.get('/revenue-receivers', authenticate, userController.getMyRevenueReceivers);
router.get('/dashboard', authenticate, userController.getDashboardStats);

export default router;
