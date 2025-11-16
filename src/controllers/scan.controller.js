// src/controllers/scan.controller.js
import { PrismaClient } from '@prisma/client';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler, verifyQRSignature } from '../utils/helpers.js';
import { pdfService } from '../services/pdf.service.js';

const prisma = new PrismaClient();

export const scanController = {
  downloadOfflinePackage: asyncHandler(async (req, res) => {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: eventId, creatorId: req.user.id },
      include: {
        ticketTypes: {
          include: {
            tickets: {
              include: { owner: { select: { username: true } } },
            },
          },
        },
      },
    });

    if (!event) throw new ApiError(404, 'Event not found');

    const blacklistedTickets = await prisma.blacklistedTicket.findMany({
      select: { ticketId: true },
    });

    const allTickets = event.ticketTypes.flatMap(tt => tt.tickets);

    const packageJson = await pdfService.generateEventOfflinePackage(
      {
        ...event,
        blacklistedTickets: blacklistedTickets.map(bt => bt.ticketId),
      },
      allTickets
    );

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=event-${eventId}-package.json`);
    res.send(packageJson);
  }),

  scanTicket: asyncHandler(async (req, res) => {
    const { ticketId, eventId, signature, scannerDevice } = req.body;

    const isSignatureValid = verifyQRSignature(ticketId, eventId, signature);
    if (!isSignatureValid) {
      await prisma.scanLog.create({
        data: { ticketId, eventId, scanResult: 'INVALID_SIGNATURE', scannerDevice },
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
        data: { ticketId, eventId, scanResult: 'BLACKLISTED', scannerDevice },
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
        data: { ticketId, eventId, scanResult: 'NOT_FOUND', scannerDevice },
      });

      return res.json({
        success: false,
        result: 'NOT_FOUND',
        message: 'Ticket not found in system',
      });
    }

    if (ticket.isUsed) {
      await prisma.scanLog.create({
        data: { ticketId, eventId, scanResult: 'ALREADY_USED', scannerDevice },
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
      data: { ticketId, eventId, scanResult: 'SUCCESS', scannerDevice },
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

  uploadScanLogs: asyncHandler(async (req, res) => {
    const { logs } = req.body;

    if (!Array.isArray(logs) || logs.length === 0) {
      throw new ApiError(400, 'Invalid logs data');
    }

    const createdLogs = await prisma.scanLog.createMany({
      data: logs.map(log => ({
        ticketId: log.ticketId,
        eventId: log.eventId,
        scanResult: log.scanResult,
        scannerDevice: log.scannerDevice,
        scannedAt: new Date(log.scannedAt),
      })),
      skipDuplicates: true,
    });

    res.json({
      success: true,
      message: `${createdLogs.count} scan logs uploaded`,
    });
  }),
};
