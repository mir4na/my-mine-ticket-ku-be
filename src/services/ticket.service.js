import { PrismaClient } from "@prisma/client";
import { generateQRSignature } from "../utils/helpers.js";
import { pdfService } from "./pdf.service.js";
import { emailService } from "./email.service.js";
import { paymentService } from "./payment.service.js";
import { treasuryService, ipfsService } from "./treasury.service.js";

const prisma = new PrismaClient();

class TicketService {
  async createPurchaseTransaction(userId, ticketTypeId, paymentMethod) {
    const ticketType = await prisma.ticketType.findUnique({
      where: { id: ticketTypeId },
      include: { event: true },
    });

    if (!ticketType) throw new Error("Ticket type not found");
    if (ticketType.sold >= ticketType.stock) throw new Error("Sold out");

    const now = new Date();
    if (now < ticketType.saleStartDate || now > ticketType.saleEndDate) {
      throw new Error("Sale period closed");
    }

    const transaction = await prisma.transaction.create({
      data: {
        ticketId: ticketTypeId,
        buyerId: userId,
        eventId: ticketType.eventId,
        amount: ticketType.price,
        paymentMethod,
        paymentStatus: "PENDING",
      },
    });

    return { ticketType, transaction };
  }

  async finalizePaidTransaction(transaction) {
    return prisma.$transaction(async (tx) => {
      const ticketType = await tx.ticketType.findUnique({
        where: { id: transaction.ticketId },
      });

      const signature = generateQRSignature(transaction.id, transaction.eventId);

      const newTicket = await tx.ticket.create({
        data: {
          ticketTypeId: transaction.ticketId,
          ownerId: transaction.buyerId,
          purchasePrice: transaction.amount,
          qrSignature: signature,
          pdfVersion: 1,
        },
      });

      await tx.ticketType.update({
        where: { id: transaction.ticketId },
        data: { sold: { increment: 1 } },
      });

      await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          paymentStatus: "PAID",
          ticketId: newTicket.id,
        },
      });

      return { ticketType, newTicket };
    });
  }
}

export const ticketService = new TicketService();
