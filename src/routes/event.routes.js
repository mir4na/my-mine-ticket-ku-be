import { Router } from 'express';
import { eventController } from '../controllers/event.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/', authenticate, authorize('EO'), eventController.createEvent);
router.post('/:eventId/approve/:email', eventController.approveRevenue);
router.post('/:eventId/tickets', authenticate, authorize('EO'), eventController.configureTickets);

router.get('/', eventController.getEvents);
router.get('/my-events', authenticate, authorize('EO'), eventController.getMyEvents);
router.get('/:id', eventController.getEventById);

router.post('/:id/complete', authenticate, authorize('EO'), eventController.completeEvent);

export default router;
