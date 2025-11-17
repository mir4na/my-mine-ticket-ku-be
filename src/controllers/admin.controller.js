import { PrismaClient } from '@prisma/client';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/helpers.js';
import blockchainService from '../services/blockchain.service.js';
import { treasuryService } from '../services/treasury.service.js';
import { custodialService } from '../services/custodial.service.js';
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
        walletAddress: receiver.walletAddress,
        percentage: receiver.percentage,
        expectedAmount: (totalRevenue * receiver.percentage) / 100,
        withdrawals: receiver.withdrawals,
      })),
    };

    res.json({ success: true, data: { report } });
  }),

  processReceiverWithdrawal: asyncHandler(async (req, res) => {
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
      receiver.walletAddress
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
      const custodialWallet = custodialService.getCustodialWallet(receiver.email);

      const { withdrawTxHash, burnTxHash } = await treasuryService.processWithdrawal(
        receiver.eventId,
        custodialWallet.privateKey,
        custodialWallet.address,
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

  processTaxWithdrawal: asyncHandler(async (req, res) => {
    const totalTaxHeld = await prisma.transaction.aggregate({
      where: { paymentStatus: 'PAID' },
      _sum: { amount: true },
    });

    const taxAmount = (totalTaxHeld._sum.amount || 0) * 0.1;

    const transferResult = await treasuryService.transferIDRToBank(taxAmount, {
      bankAccount: config.platform.taxBankAccount,
      bankName: config.platform.taxBankName,
      accountHolder: config.platform.taxAccountHolder,
    });

    res.json({
      success: true,
      message: 'Tax withdrawal processed',
      data: {
        amount: taxAmount,
        transfer: transferResult,
      },
    });
  }),

  processPlatformWithdrawal: asyncHandler(async (req, res) => {
    const totalRevenueHeld = await prisma.transaction.aggregate({
      where: { paymentStatus: 'PAID' },
      _sum: { amount: true },
    });

    const platformAmount = (totalRevenueHeld._sum.amount || 0) * 0.025;

    const transferResult = await treasuryService.transferIDRToBank(platformAmount, {
      bankAccount: config.platform.platformBankAccount,
      bankName: config.platform.platformBankName,
      accountHolder: config.platform.platformAccountHolder,
    });

    res.json({
      success: true,
      message: 'Platform fee withdrawal processed',
      data: {
        amount: platformAmount,
        transfer: transferResult,
      },
    });
  }),
};