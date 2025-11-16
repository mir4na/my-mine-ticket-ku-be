import { PrismaClient } from '@prisma/client';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/helpers.js';

const prisma = new PrismaClient();

export const userController = {
  getMyTickets: asyncHandler(async (req, res) => {
    const tickets = await prisma.ticket.findMany({
      where: { ownerId: req.user.id },
      include: {
        ticketType: {
          include: {
            event: {
              select: {
                id: true,
                name: true,
                bannerUrl: true,
                location: true,
                startDate: true,
                endDate: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: { tickets } });
  }),

  getMyTransactions: asyncHandler(async (req, res) => {
    const transactions = await prisma.transaction.findMany({
      where: { buyerId: req.user.id },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            bannerUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: { transactions } });
  }),

  getMyRevenueReceivers: asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    const receivers = await prisma.revenueReceiver.findMany({
      where: { email: user.email },
      include: {
        event: {
          select: { id: true, name: true, status: true },
        },
        withdrawals: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: { receivers } });
  }),

  getDashboardStats: asyncHandler(async (req, res) => {
    const [ticketCount, transactionCount, revenueReceiverCount] = await Promise.all([
      prisma.ticket.count({ where: { ownerId: req.user.id } }),
      prisma.transaction.count({
        where: { buyerId: req.user.id, paymentStatus: 'PAID' },
      }),
      prisma.revenueReceiver.count({
        where: { user: { id: req.user.id } },
      }),
    ]);

    res.json({
      success: true,
      data: { ticketCount, transactionCount, revenueReceiverCount },
    });
  }),
};
