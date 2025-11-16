// src/controllers/event.controller.js
import { PrismaClient } from '@prisma/client';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler, paginate } from '../utils/helpers.js';
import { emailService } from '../services/email.service.js';
import blockchainService from '../services/blockchain.service.js';

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
      const totalPercentage = receivers.reduce((s, r) => s + r.percentage, 0);
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

      for (const receiver of receivers) {
        const url = `${process.env.FRONTEND_URL}/approve-revenue/${event.id}/${receiver.email}`;
        await emailService.sendRevenueApprovalEmail(
          receiver.email,
          { eventName: name, percentage: receiver.percentage },
          url
        );
      }

      await prisma.event.update({
        where: { id: event.id },
        data: { status: 'PENDING_APPROVAL' },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
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
    if (receiver.approvalStatus !== 'PENDING') {
      throw new ApiError(400, 'Revenue split already processed');
    }

    await prisma.revenueReceiver.update({
      where: { id: receiver.id },
      data: {
        approvalStatus: approved ? 'APPROVED' : 'REJECTED',
        ...(approved && { bankAccount, bankName, accountHolder }),
        ...(!approved && { rejectionReason }),
      },
    });

    const all = await prisma.revenueReceiver.findMany({ where: { eventId } });
    const allApproved = all.every(r => r.approvalStatus === 'APPROVED');
    const anyRejected = all.some(r => r.approvalStatus === 'REJECTED');

    if (allApproved) {
      const event = await prisma.event.update({
        where: { id: eventId },
        data: { status: 'ACCEPTED' },
      });

      const addresses = all.map(r => r.walletAddress || r.email);
      const percentages = all.map(r => r.percentage);

      await blockchainService.createEvent(eventId, addresses, percentages);
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
    if (event.status !== 'ACCEPTED') {
      throw new ApiError(400, 'Event must be accepted before configuring tickets');
    }

    const created = await prisma.$transaction(
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
      data: { ticketTypes: created },
    });
  }),

  getEvents: asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status, location } = req.query;
    const { skip, take } = paginate(+page, +limit);

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
          page: +page,
          limit: +limit,
          total,
          totalPages: Math.ceil(total / +limit),
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
          select: {
            email: true,
            percentage: true,
            approvalStatus: true,
          },
        },
      },
    });

    if (!event) throw new ApiError(404, 'Event not found');

    res.json({
      success: true,
      data: { event },
    });
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

    res.json({
      success: true,
      data: { events },
    });
  }),

  completeEvent: asyncHandler(async (req, res) => {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id, creatorId: req.user.id },
    });

    if (!event) throw new ApiError(404, 'Event not found');
    if (event.status !== 'ACCEPTED') throw new ApiError(400, 'Event must be accepted');
    if (new Date() < new Date(event.endDate)) {
      throw new ApiError(400, 'Event has not ended yet');
    }

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
};
