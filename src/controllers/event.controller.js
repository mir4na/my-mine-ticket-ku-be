import { PrismaClient } from '@prisma/client';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler, paginate } from '../utils/helpers.js';
import { emailService } from '../services/email.service.js';
import blockchainService from '../services/blockchain.service.js';
import { custodialService } from '../services/custodial.service.js';
import { csvService } from '../services/csv.service.js';

const prisma = new PrismaClient();

export const eventController = {
  createEvent: asyncHandler(async (req, res) => {
    const { name, bannerUrl, location, startDate, endDate, receivers } = req.body;

    const event = await prisma.event.create({
      data: {
        name,
        bannerUrl,
        location,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'DRAFT',
        creatorId: req.user.id,
      },
    });

    if (receivers?.length > 0) {
      const totalPercentage = receivers.reduce((sum, r) => sum + r.percentage, 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        throw new ApiError(400, 'Total percentage must equal 100%');
      }

      await prisma.revenueReceiver.createMany({
        data: receivers.map(r => ({
          eventId: event.id,
          email: r.email,
          percentage: r.percentage,
        })),
      });

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      for (const r of receivers) {
        try {
          const approvalLink = `${frontendUrl}/approve-revenue/${event.id}/${encodeURIComponent(r.email)}`;
          await emailService.sendRevenueApprovalEmail(
            r.email,
            { eventName: name, percentage: r.percentage },
            approvalLink
          );
          console.log(`Approval email sent to ${r.email}`);
        } catch (emailError) {
          console.error(`Failed to send email to ${r.email}:`, emailError.message);
        }
      }

      await prisma.event.update({
        where: { id: event.id },
        data: { status: 'PENDING_APPROVAL' },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Event created successfully. Platform Fee (2.5%) will be automatically deducted.',
      data: { event },
    });
  }),

  approveRevenue: asyncHandler(async (req, res) => {
    const { eventId, email } = req.params;
    const { bankAccount, bankName, accountHolder, approved, rejectionReason } = req.body;

    const receiver = await prisma.revenueReceiver.findUnique({
      where: { eventId_email: { eventId, email } },
    });

    if (!receiver) throw new ApiError(404, 'Revenue receiver not found');
    if (receiver.approvalStatus !== 'PENDING') throw new ApiError(400, 'Revenue split already processed');

    const custodialWallet = custodialService.getCustodialWallet(email);

    await prisma.revenueReceiver.update({
      where: { id: receiver.id },
      data: {
        approvalStatus: approved ? 'APPROVED' : 'REJECTED',
        walletAddress: approved ? custodialWallet.address : null,
        ...(approved && { bankAccount, bankName, accountHolder }),
        ...(!approved && { rejectionReason }),
      },
    });

    const allReceivers = await prisma.revenueReceiver.findMany({ where: { eventId } });
    const allApproved = allReceivers.every(r => r.approvalStatus === 'APPROVED');
    const anyRejected = allReceivers.some(r => r.approvalStatus === 'REJECTED');

    if (allApproved) {
      const event = await prisma.event.update({
        where: { id: eventId },
        data: { status: 'ACCEPTED' },
      });

      const receiverAddresses = allReceivers.map(r => r.walletAddress);
      const percentages = allReceivers.map(r => r.percentage);

      await blockchainService.createEvent(eventId, receiverAddresses, percentages);
    } else if (anyRejected) {
      await prisma.event.update({
        where: { id: eventId },
        data: { status: 'REJECTED' },
      });
    }

    res.json({
      success: true,
      message: approved ? 'Revenue split approved' : 'Revenue split rejected',
    });
  }),

  configureTickets: asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { ticketTypes } = req.body;

    const event = await prisma.event.findUnique({
      where: { id: eventId, creatorId: req.user.id },
    });

    if (!event) throw new ApiError(404, 'Event not found');
    if (event.status !== 'ACCEPTED') throw new ApiError(400, 'Event must be accepted before configuring tickets');

    const createdTicketTypes = await prisma.$transaction(
      ticketTypes.map(t =>
        prisma.ticketType.create({
          data: {
            eventId,
            name: t.name,
            price: t.price,
            stock: t.stock,
            saleStartDate: new Date(t.saleStartDate),
            saleEndDate: new Date(t.saleEndDate),
          },
        })
      )
    );

    res.status(201).json({
      success: true,
      message: 'Tickets configured successfully',
      data: { ticketTypes: createdTicketTypes },
    });
  }),

  getEvents: asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status, location } = req.query;
    const { skip, take } = paginate(parseInt(page), parseInt(limit));

    const where = {
      status: status || 'ACCEPTED',
      ...(location && { location: { contains: location, mode: 'insensitive' } }),
    };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take,
        include: {
          creator: { select: { username: true, displayName: true } },
          ticketTypes: true,
          _count: { select: { transactions: true } },
        },
        orderBy: { startDate: 'asc' },
      }),
      prisma.event.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        events,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  }),

  getEventById: asyncHandler(async (req, res) => {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        creator: { select: { username: true, displayName: true } },
        ticketTypes: true,
        revenueReceivers: {
          select: { email: true, percentage: true, approvalStatus: true, walletAddress: true },
        },
      },
    });

    if (!event) throw new ApiError(404, 'Event not found');

    res.json({ success: true, data: { event } });
  }),

  getMyEvents: asyncHandler(async (req, res) => {
    const events = await prisma.event.findMany({
      where: { creatorId: req.user.id },
      include: {
        ticketTypes: true,
        revenueReceivers: true,
        _count: { select: { transactions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: { events } });
  }),

  completeEvent: asyncHandler(async (req, res) => {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id, creatorId: req.user.id },
    });

    if (!event) throw new ApiError(404, 'Event not found');
    if (event.status !== 'ACCEPTED') throw new ApiError(400, 'Event must be accepted');
    if (new Date() < new Date(event.endDate)) throw new ApiError(400, 'Event has not ended yet');

    const txHash = await blockchainService.completeEvent(id);

    await prisma.event.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });

    res.json({
      success: true,
      message: 'Event completed and revenue split initiated',
      data: { txHash },
    });
  }),

  exportEventAudit: asyncHandler(async (req, res) => {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id, creatorId: req.user.id },
      include: {
        ticketTypes: {
          include: {
            _count: { select: { tickets: true } }
          }
        },
        revenueReceivers: {
          include: {
            withdrawals: true
          }
        },
        transactions: {
          where: { paymentStatus: 'PAID' },
          include: {
            buyer: { select: { username: true, email: true } },
            ticketType: { select: { name: true, price: true } }
          }
        }
      }
    });

    if (!event) throw new ApiError(404, 'Event not found');

    const totalRevenue = event.transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const platformFee = (totalRevenue * 2.5) / 100;
    const netRevenue = totalRevenue - platformFee;

    const auditData = {
      event: {
        name: event.name,
        location: event.location,
        startDate: event.startDate,
        endDate: event.endDate,
        status: event.status
      },
      ticketSales: {
        totalTicketsSold: event.transactions.length,
        totalRevenue: totalRevenue,
        platformFee: platformFee,
        netRevenue: netRevenue,
        ticketTypes: event.ticketTypes.map(tt => ({
          name: tt.name,
          price: tt.price,
          stock: tt.stock,
          sold: tt.sold,
          revenue: tt.sold * tt.price
        }))
      },
      revenueSplit: event.revenueReceivers.map(receiver => ({
        email: receiver.email,
        percentage: receiver.percentage,
        expectedAmount: (netRevenue * receiver.percentage) / 100,
        withdrawals: receiver.withdrawals.map(w => ({
          amount: w.amount,
          status: w.status,
          createdAt: w.createdAt
        }))
      })),
      transactions: event.transactions.map(tx => ({
        id: tx.id,
        buyer: tx.buyer.username,
        ticketType: tx.ticketType.name,
        amount: tx.amount,
        date: tx.createdAt
      }))
    };

    const csvContent = csvService.generateAuditCSV(auditData);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=audit-${event.name.replace(/\s+/g, '-')}-${Date.now()}.csv`);
    res.send(csvContent);
  })

};