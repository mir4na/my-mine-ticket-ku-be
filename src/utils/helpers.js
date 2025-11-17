import crypto from 'crypto';
import { config } from '../config/index.js';

export const generateQRSignature = (ticketId, eventId) => {
  const data = `${ticketId}:${eventId}`;
  return crypto
    .createHmac('sha256', config.security.hmacSecret)
    .update(data)
    .digest('hex');
};

export const verifyQRSignature = (ticketId, eventId, signature) => {
  const expectedSignature = generateQRSignature(ticketId, eventId);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};

export const generateQRData = (ticketId, eventId) => {
  const signature = generateQRSignature(ticketId, eventId);
  return {
    ticket_id: ticketId,
    event_id: eventId,
    signature,
  };
};

export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const paginate = (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return { skip, take: limit };
};

export const calculateRevenueSplit = (amount) => {
  const platformFee = (amount * config.platform.platformFeePercentage) / 100;
  const netAmount = amount - platformFee;

  return {
    platformFee,
    netAmount,
    grossAmount: amount,
  };
};

export const calculateResaleSplit = (amount) => {
  const resaleFee = (amount * config.platform.resaleFeePercentage) / 100;
  const platformFee = (amount * config.platform.platformFeePercentage) / 100;
  const netAmount = amount - resaleFee - platformFee;

  return {
    resaleFee,
    platformFee,
    netAmount,
    grossAmount: amount,
  };
};