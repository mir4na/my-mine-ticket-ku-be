import { Router } from "express";
import { ticketController } from "../controllers/ticket.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/purchase", authenticate, ticketController.purchaseTicket);
router.post("/payment-webhook", ticketController.handlePaymentWebhook);
router.get("/my-tickets", authenticate, ticketController.getMyTickets);
router.get("/:id", authenticate, ticketController.getTicketDetail);
router.post("/:ticketId/claim-nft", authenticate, ticketController.claimNFT);
router.post("/:ticketId/resale", authenticate, ticketController.createResaleListing);
router.get("/resale/listings", ticketController.getResaleListings);

export default router;
