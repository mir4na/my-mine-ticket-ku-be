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
        ticketTypeId: ticketTypeId,
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
    console.log('Received webhook:', JSON.stringify(notification, null, 2));

    const { orderId, paymentStatus } = await paymentService.verifyNotification(notification);
    console.log(`Verified: orderId=${orderId}, status=${paymentStatus}`);

    const transaction = await prisma.transaction.findUnique({
      where: { id: orderId },
      include: { buyer: true, event: true, ticketType: true },
    });

    if (!transaction) throw new ApiError(404, 'Transaction not found');

    if (paymentStatus === 'PAID' && transaction.paymentStatus !== 'PAID') {
      console.log(`Processing payment for transaction ${transaction.id}`);

      const qrSignature = generateQRSignature(transaction.id, transaction.eventId);

      const ticket = await prisma.ticket.create({
        data: {
          ticketTypeId: transaction.ticketTypeId,
          ownerId: transaction.buyerId,
          purchasePrice: transaction.amount,
          qrSignature,
          pdfVersion: 1,
        },
      });
      console.log(`Ticket created: ${ticket.id}`);

      await prisma.ticketType.update({
        where: { id: transaction.ticketTypeId },
        data: { sold: { increment: 1 } },
      });

      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { paymentStatus: 'PAID', ticketId: ticket.id },
      });

      console.log('Uploading metadata to IPFS...');
      const metadataURI = await ipfsService.uploadTicketMetadata({
        ticketId: ticket.id,
        eventName: transaction.event.name,
        eventBanner: transaction.event.bannerUrl,
        ticketType: transaction.ticketType.name,
        price: transaction.amount,
        purchaseDate: new Date().toISOString(),
      });
      console.log(`Metadata uploaded: ${metadataURI}`);

      console.log('Processing on-chain purchase...');
      const purchaseResult = await treasuryService.processTicketPurchase(
        transaction.eventId,
        transaction.buyer.walletAddress || transaction.buyer.email,
        transaction.amount,
        metadataURI
      );
      console.log(`Blockchain tx: ${purchaseResult.escrowTxHash}`);
      console.log(`NFT Token ID: ${purchaseResult.nftTokenId}`);

      await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          nftTokenId: purchaseResult.nftTokenId,
          nftMetadataUri: metadataURI,
        },
      });

      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { txHash: purchaseResult.escrowTxHash },
      });

      console.log('Sending ticket email...');
      const pdfBuffer = await pdfService.generateTicketPDF({
        ticketId: ticket.id,
        eventId: transaction.eventId,
        eventName: transaction.event.name,
        eventDate: transaction.event.startDate.toISOString(),
        eventLocation: transaction.event.location,
        ticketType: transaction.ticketType.name,
        price: transaction.amount,
        buyerName: transaction.buyer.displayName || transaction.buyer.username,
        pdfVersion: 1,
      });

      await emailService.sendTicketEmail(
        transaction.buyer.email,
        {
          eventName: transaction.event.name,
          ticketType: transaction.ticketType.name,
          eventDate: transaction.event.startDate.toLocaleDateString(),
          eventLocation: transaction.event.location,
          ticketId: ticket.id,
          buyerName: transaction.buyer.displayName || transaction.buyer.username,
        },
        pdfBuffer
      );
      console.log('Email sent successfully');
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

  purchaseResaleTicket: asyncHandler(async (req, res) => {
    const { listingId } = req.params;
    const { paymentMethod } = req.body;

    const listing = await prisma.resaleListing.findUnique({
      where: { id: listingId },
      include: {
        ticket: {
          include: {
            ticketType: { include: { event: true } }
          }
        }
      }
    });

    if (!listing) throw new ApiError(404, 'Listing not found');
    if (listing.status !== 'ACTIVE') throw new ApiError(400, 'Listing not active');
    if (listing.sellerId === req.user.id) throw new ApiError(400, 'Cannot buy your own ticket');

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    const transaction = await prisma.resaleTransaction.create({
      data: {
        listingId: listingId,
        buyerId: req.user.id,
        sellerId: listing.sellerId,
        eventId: listing.ticket.ticketType.eventId,
        amount: listing.price,
        paymentMethod,
        paymentStatus: 'PENDING',
      },
    });

    const paymentData = await paymentService.createTransaction(
      transaction.id,
      listing.price,
      { first_name: user.displayName || user.username, email: user.email }
    );

    await prisma.resaleTransaction.update({
      where: { id: transaction.id },
      data: { externalTxId: paymentData.token },
    });

    res.status(201).json({
      success: true,
      message: 'Resale transaction initiated',
      data: {
        transactionId: transaction.id,
        paymentToken: paymentData.token,
        redirectUrl: paymentData.redirect_url,
      },
    });
  }),

  handleResaleWebhook: asyncHandler(async (req, res) => {
    const notification = req.body;
    console.log('Received resale webhook:', JSON.stringify(notification, null, 2));

    const { orderId, paymentStatus } = await paymentService.verifyNotification(notification);

    const transaction = await prisma.resaleTransaction.findUnique({
      where: { id: orderId },
      include: {
        buyer: true,
        seller: true,
        listing: {
          include: {
            ticket: {
              include: {
                ticketType: { include: { event: true } }
              }
            }
          }
        }
      }
    });

    if (!transaction) throw new ApiError(404, 'Transaction not found');

    if (paymentStatus === 'PAID' && transaction.paymentStatus !== 'PAID') {
      const resaleFee = (transaction.amount * config.platform.resaleFeePercentage) / 100;
      const platformFee = (transaction.amount * config.platform.platformFeePercentage) / 100;
      const sellerAmount = transaction.amount - resaleFee - platformFee;

      await prisma.resaleTransaction.update({
        where: { id: transaction.id },
        data: {
          paymentStatus: 'PAID',
          resaleFee: resaleFee,
          platformFee: platformFee,
          sellerAmount: sellerAmount
        }
      });

      const ticket = transaction.listing.ticket;
      const newQrSignature = generateQRSignature(ticket.id, ticket.ticketType.eventId);

      await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          ownerId: transaction.buyerId,
          eligibleForResale: false,
          qrSignature: newQrSignature,
          pdfVersion: { increment: 1 }
        }
      });

      await prisma.blacklistedTicket.create({
        data: {
          ticketId: ticket.id,
          reason: 'Resold - old QR invalidated'
        }
      });

      await prisma.resaleListing.update({
        where: { id: transaction.listingId },
        data: { status: 'SOLD' }
      });

      await treasuryService.processResalePayment(
        transaction.eventId,
        sellerAmount,
        resaleFee,
        platformFee,
        transaction.seller.email
      );

      const pdfBuffer = await pdfService.generateTicketPDF({
        ticketId: ticket.id,
        eventId: ticket.ticketType.eventId,
        eventName: ticket.ticketType.event.name,
        eventDate: ticket.ticketType.event.startDate.toISOString(),
        eventLocation: ticket.ticketType.event.location,
        ticketType: ticket.ticketType.name,
        price: transaction.amount,
        buyerName: transaction.buyer.displayName || transaction.buyer.username,
        pdfVersion: ticket.pdfVersion + 1,
      });

      await emailService.sendTicketEmail(
        transaction.buyer.email,
        {
          eventName: ticket.ticketType.event.name,
          ticketType: ticket.ticketType.name,
          eventDate: ticket.ticketType.event.startDate.toLocaleDateString(),
          eventLocation: ticket.ticketType.event.location,
          ticketId: ticket.id,
          buyerName: transaction.buyer.displayName || transaction.buyer.username,
        },
        pdfBuffer
      );
    }

    res.json({ success: true });
  })
};