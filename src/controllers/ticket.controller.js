// controllers/ticket.controller.js
import { PrismaClient } from '@prisma/client';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler, generateQRSignature } from '../utils/helpers.js';
import { paymentService } from '../services/payment.service.js';
import { emailService } from '../services/email.service.js';
import { pdfService } from '../services/pdf.service.js';
import { treasuryService } from '../services/treasury.service.js';
import { ipfsService } from '../services/ipfs.service.js';
import blockchainService from '../services/blockchain.service.js';
import { config } from '../config/index.js';

const prisma = new PrismaClient();

export const ticketController = {
  purchaseTicket: asyncHandler(async (req, res) => {
    const { ticketTypeId, paymentMethod } = req.body;

    const ticketType = await prisma.ticketType.findUnique({
      where: { id: ticketTypeId },
      include: { event: true },
    });

    if (!ticketType) throw new ApiError(404, 'Ticket type not found');
    if (ticketType.sold >= ticketType.stock) throw new ApiError(400, 'Ticket sold out');

    const now = new Date();
    if (now < ticketType.saleStartDate || now > ticketType.saleEndDate) {
      throw new ApiError(400, 'Ticket sale period invalid');
    }

    if (ticketType.event.creatorId === req.user.id) {
      throw new ApiError(400, 'EO cannot purchase own ticket');
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    const transaction = await prisma.transaction.create({
      data: {
        ticketId: ticketTypeId,
        buyerId: req.user.id,
        eventId: ticketType.eventId,
        amount: ticketType.price,
        paymentMethod,
        paymentStatus: 'PENDING',
      },
    });

    const paymentData = await paymentService.createTransaction(
      transaction.id,
      ticketType.price,
      { first_name: user.displayName || user.username, email: user.email }
    );

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { externalTxId: paymentData.token },
    });

    res.status(201).json({
      success: true,
      message: 'Transaction initiated',
      data: {
        transactionId: transaction.id,
        paymentToken: paymentData.token,
        redirectUrl: paymentData.redirect_url,
      },
    });
  }),

  handlePaymentWebhook: asyncHandler(async (req, res) => {
    const notification = req.body;
    const { orderId, paymentStatus } = await paymentService.verifyNotification(notification);

    const transaction = await prisma.transaction.findUnique({
      where: { id: orderId },
      include: { buyer: true, event: true },
    });

    if (!transaction) throw new ApiError(404, 'Transaction not found');

    if (paymentStatus === 'PAID' && transaction.paymentStatus !== 'PAID') {
      await prisma.$transaction(async (tx) => {
        const ticketType = await tx.ticketType.findUnique({
          where: { id: transaction.ticketId },
        });

        const qrSignature = generateQRSignature(transaction.id, transaction.eventId);

        const ticket = await tx.ticket.create({
          data: {
            ticketTypeId: transaction.ticketId,
            ownerId: transaction.buyerId,
            purchasePrice: transaction.amount,
            qrSignature,
            pdfVersion: 1,
          },
        });

        await tx.ticketType.update({
          where: { id: transaction.ticketId },
          data: { sold: { increment: 1 } },
        });

        await tx.transaction.update({
          where: { id: transaction.id },
          data: { paymentStatus: 'PAID', ticketId: ticket.id },
        });

        const metadataURI = await ipfsService.uploadTicketMetadata({
          ticketId: ticket.id,
          eventName: transaction.event.name,
          eventBanner: transaction.event.bannerUrl,
          ticketType: ticketType.name,
          price: transaction.amount,
          purchaseDate: new Date().toISOString(),
        });

        const purchaseResult = await treasuryService.processTicketPurchase(
          transaction.eventId,
          transaction.buyer.walletAddress || transaction.buyer.email,
          transaction.amount,
          metadataURI
        );

        await tx.ticket.update({
          where: { id: ticket.id },
          data: {
            nftTokenId: purchaseResult.nftTokenId,
            nftMetadataUri: metadataURI,
          },
        });

        await tx.transaction.update({
          where: { id: transaction.id },
          data: { txHash: purchaseResult.escrowTxHash },
        });

        const pdfBuffer = await pdfService.generateTicketPDF({
          ticketId: ticket.id,
          eventId: transaction.eventId,
          eventName: transaction.event.name,
          eventDate: transaction.event.startDate.toISOString(),
          eventLocation: transaction.event.location,
          ticketType: ticketType.name,
          price: transaction.amount,
          buyerName: transaction.buyer.displayName || transaction.buyer.username,
          pdfVersion: 1,
        });

        await emailService.sendTicketEmail(
          transaction.buyer.email,
          {
            eventName: transaction.event.name,
            ticketType: ticketType.name,
            eventDate: transaction.event.startDate.toLocaleDateString(),
            eventLocation: transaction.event.location,
            ticketId: ticket.id,
            buyerName: transaction.buyer.displayName || transaction.buyer.username,
          },
          pdfBuffer
        );
      });
    }

    res.json({ success: true });
  }),

  getMyTickets: asyncHandler(async (req, res) => {
    const tickets = await prisma.ticket.findMany({
      where: { ownerId: req.user.id },
      include: { ticketType: { include: { event: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: { tickets } });
  }),

  getTicketDetail: asyncHandler(async (req, res) => {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: {
        ticketType: { include: { event: true } },
        owner: {
          select: {
            username: true,
            displayName: true,
            email: true,
            walletAddress: true,
          },
        },
      },
    });

    if (!ticket) throw new ApiError(404, 'Ticket not found');
    if (ticket.ownerId !== req.user.id) throw new ApiError(403, 'Access denied');

    res.json({ success: true, data: { ticket } });
  }),

  claimNFT: asyncHandler(async (req, res) => {
    const { ticketId } = req.params;

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new ApiError(404, 'Ticket not found');
    if (ticket.ownerId !== req.user.id) throw new ApiError(403, 'Access denied');

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user.walletAddress) throw new ApiError(400, 'Please connect your wallet first');
    if (!ticket.nftTokenId) throw new ApiError(400, 'NFT not yet minted');

    const txHash = await blockchainService.claimNFT(ticket.nftTokenId, user.walletAddress);

    res.json({
      success: true,
      message: 'NFT claimed successfully',
      data: {
        txHash,
        nftTokenId: ticket.nftTokenId,
        explorerUrl: `https://sepolia.etherscan.io/tx/${txHash}`,
      },
    });
  }),

  createResaleListing: asyncHandler(async (req, res) => {
    const { ticketId } = req.params;
    const { price } = req.body;

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        ticketType: { include: { event: true } },
      },
    });

    if (!ticket) throw new ApiError(404, 'Ticket not found');
    if (ticket.ownerId !== req.user.id) throw new ApiError(403, 'Access denied');
    if (!ticket.eligibleForResale) throw new ApiError(400, 'Ticket not eligible for resale');
    if (ticket.nftTokenId) throw new ApiError(400, 'Cannot resell claimed NFT tickets');

    const maxPrice = ticket.purchasePrice * (config.platform.maxResalePrice / 100);
    if (price > maxPrice) throw new ApiError(400, `Price cannot exceed ${config.platform.maxResalePrice}%`);

    const now = new Date();
    const eventStart = new Date(ticket.ticketType.event.startDate);
    const hoursUntilEvent = (eventStart - now) / (1000 * 60 * 60);

    if (hoursUntilEvent < 6) throw new ApiError(400, 'Cannot resell less than 6 hours before event');

    const listing = await prisma.resaleListing.create({
      data: { ticketId, sellerId: req.user.id, price, status: 'ACTIVE' },
    });

    res.status(201).json({
      success: true,
      message: 'Ticket listed for resale',
      data: { listing },
    });
  }),

  getResaleListings: asyncHandler(async (req, res) => {
    const { eventId } = req.query;

    const listings = await prisma.resaleListing.findMany({
      where: {
        status: 'ACTIVE',
        ...(eventId && { ticket: { ticketType: { eventId } } }),
      },
      include: {
        ticket: {
          include: {
            ticketType: { include: { event: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: { listings } });
  }),
};
