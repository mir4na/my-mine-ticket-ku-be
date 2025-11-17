import { PrismaClient } from '@prisma/client';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler, verifyQRSignature } from '../utils/helpers.js';

const prisma = new PrismaClient();

export const scanController = {
  scanTicket: asyncHandler(async (req, res) => {
    const { ticketId, eventId, signature } = req.body;

    const isSignatureValid = verifyQRSignature(ticketId, eventId, signature);
    if (!isSignatureValid) {
      await prisma.scanLog.create({
        data: { ticketId, eventId, scanResult: 'INVALID_SIGNATURE' },
      });

      return res.json({
        success: false,
        result: 'INVALID_SIGNATURE',
        message: 'QR code signature is invalid or tampered',
      });
    }

    const blacklisted = await prisma.blacklistedTicket.findUnique({ where: { ticketId } });

    if (blacklisted) {
      await prisma.scanLog.create({
        data: { ticketId, eventId, scanResult: 'BLACKLISTED' },
      });

      return res.json({
        success: false,
        result: 'BLACKLISTED',
        message: 'This ticket has been blacklisted',
      });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        owner: { select: { username: true, displayName: true } },
        ticketType: {
          include: { event: true },
        },
      },
    });

    if (!ticket) {
      await prisma.scanLog.create({
        data: { ticketId, eventId, scanResult: 'NOT_FOUND' },
      });

      return res.json({
        success: false,
        result: 'NOT_FOUND',
        message: 'Ticket not found in system',
      });
    }

    if (ticket.isUsed) {
      await prisma.scanLog.create({
        data: { ticketId, eventId, scanResult: 'ALREADY_USED' },
      });

      return res.json({
        success: false,
        result: 'ALREADY_USED',
        message: `Ticket already used at ${ticket.usedAt?.toISOString()}`,
        usedAt: ticket.usedAt,
      });
    }

    await prisma.ticket.update({
      where: { id: ticketId },
      data: { isUsed: true, usedAt: new Date() },
    });

    await prisma.scanLog.create({
      data: { ticketId, eventId, scanResult: 'SUCCESS' },
    });

    res.json({
      success: true,
      result: 'SUCCESS',
      message: 'WELCOME - TICKET VALID',
      ticket: {
        owner: ticket.owner.displayName || ticket.owner.username,
        ticketType: ticket.ticketType.name,
        event: ticket.ticketType.event.name,
      },
    });
  }),

  getScanLogs: asyncHandler(async (req, res) => {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: eventId, creatorId: req.user.id },
    });

    if (!event) throw new ApiError(404, 'Event not found');

    const logs = await prisma.scanLog.findMany({
      where: { eventId },
      include: {
        ticket: {
          include: {
            owner: { select: { username: true, displayName: true } },
            ticketType: { select: { name: true } }
          }
        }
      },
      orderBy: { scannedAt: 'desc' }
    });

    res.json({ success: true, data: { logs } });
  })
};