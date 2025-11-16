import { ticketService } from "../services/ticket.service.js";
import { asyncHandler } from "../utils/helpers.js";

export const ticketController = {
  purchaseTicket: asyncHandler(async (req, res) => {
    const { ticketTypeId, paymentMethod } = req.body;

    const result = await ticketService.createPurchaseTransaction(
      req.user.id,
      ticketTypeId,
      paymentMethod
    );

    res.json({
      success: true,
      message: "Transaction started",
      data: result,
    });
  }),
};
