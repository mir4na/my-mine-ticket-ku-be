// src/controllers/admin.controller.js
import { PrismaClient } from '@prisma/client';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/helpers.js';
import blockchainService from '../services/blockchain.service.js';
import { treasuryService } from '../services/treasury.service.js';
import { config } from '../config/index.js';

const prisma = new PrismaClient();

export const adminController = {
  getPlatformStats: asyncHandler(async (req, res) => {
    const [totalEvents, totalTickets, totalRevenue, totalUsers] = await Promise.all([
      prisma.event.count(),
      prisma.ticket.count(),
      prisma.transaction.aggregate({
        where: { paymentStatus: 'PAID' },
        _sum: { amount: true },
      }),
      prisma.user.count(),
    ]);

    res.json({
      success: true,
      data: {
        totalEvents,
        totalTickets,
        totalRevenue: totalRevenue._sum.amount || 0,
        totalUsers,
      },
    });
  }),

  updatePlatformConfig: asyncHandler(async (req, res) => {
    const { key, value } = req.body;

    const configData = await prisma.platformConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    res.json({
      success: true,
      message: 'Configuration updated',
      data: { config: configData },
    });
  }),

  getRevenueReport: asyncHandler(async (req, res) => {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        revenueReceivers: {
          include: { withdrawals: true },
        },
        transactions: { where: { paymentStatus: 'PAID' } },
      },
    });

    if (!event) throw new ApiError(404, 'Event not found');

    const totalRevenue = event.transactions.reduce((sum, tx) => sum + tx.amount, 0);

    const report = {
      eventId: event.id,
      eventName: event.name,
      totalRevenue,
      receivers: event.revenueReceivers.map(receiver => ({
        email: receiver.email,
        percentage: receiver.percentage,
        expectedAmount: (totalRevenue * receiver.percentage) / 100,
        withdrawals: receiver.withdrawals,
      })),
    };

    res.json({ success: true, data: { report } });
  }),

  processWithdrawal: asyncHandler(async (req, res) => {
    const { receiverId } = req.body;

    const receiver = await prisma.revenueReceiver.findUnique({
      where: { id: receiverId },
      include: { event: true },
    });

    if (!receiver) throw new ApiError(404, 'Receiver not found');
    if (receiver.event.status !== 'COMPLETED')
      throw new ApiError(400, 'Event must be completed before withdrawal');

    const existingWithdrawal = await prisma.withdrawal.findFirst({
      where: {
        receiverId,
        status: { in: ['PENDING', 'PROCESSING', 'COMPLETED'] },
      },
    });

    if (existingWithdrawal) throw new ApiError(400, 'Withdrawal already processed or in progress');

    const balance = await blockchainService.getReceiverBalance(
      receiver.eventId,
      receiver.walletAddress || receiver.email
    );

    if (balance.withdrawn) throw new ApiError(400, 'Balance already withdrawn');

    const withdrawal = await prisma.withdrawal.create({
      data: {
        receiverId,
        amount: parseFloat(balance.balance),
        wIDRAmount: parseFloat(balance.balance),
        status: 'PROCESSING',
      },
    });

    try {
      const { withdrawTxHash, burnTxHash } = await treasuryService.processWithdrawal(
        receiver.eventId,
        receiver.walletAddress || receiver.email,
        config.treasury.walletAddress,
        parseFloat(balance.balance),
        {
          bankAccount: receiver.bankAccount,
          bankName: receiver.bankName,
          accountHolder: receiver.accountHolder,
        }
      );

      await prisma.withdrawal.update({
        where: { id: withdrawal.id },
        data: {
          status: 'COMPLETED',
          txHash: withdrawTxHash,
        },
      });

      res.json({
        success: true,
        message: 'Withdrawal processed successfully',
        data: {
          withdrawal,
          withdrawTxHash,
          burnTxHash,
        },
      });
    } catch (error) {
      await prisma.withdrawal.update({
        where: { id: withdrawal.id },
        data: { status: 'FAILED' },
      });

      throw error;
    }
  }),
};
