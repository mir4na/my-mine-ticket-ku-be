import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { generateQRData } from '../utils/helpers.js';

class PDFService {
  async generateTicketPDF(ticketData) {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        // Generate QR
        const qrData = generateQRData(ticketData.ticketId, ticketData.eventId);
        const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData));

        doc.fontSize(25).text('MyMineTicketKu', { align: 'center' });
        doc.moveDown();

        doc.fontSize(20).text(ticketData.eventName, { align: 'center' });
        doc.moveDown();

        doc.fontSize(12);
        doc.text(`Ticket Type: ${ticketData.ticketType}`);
        doc.text(`Date: ${ticketData.eventDate}`);
        doc.text(`Location: ${ticketData.eventLocation}`);
        doc.text(`Owner: ${ticketData.buyerName}`);
        doc.moveDown();

        doc.text(`Ticket ID: ${ticketData.ticketId}`);
        doc.text(`Purchase Price: Rp ${ticketData.price.toLocaleString('id-ID')}`);
        doc.text(`PDF Version: ${ticketData.pdfVersion}`);
        doc.moveDown(2);

        const qrImageBuffer = Buffer.from(
          qrCodeDataURL.replace(/^data:image\/png;base64,/, ''),
          'base64'
        );

        doc.image(qrImageBuffer, {
          fit: [200, 200],
          align: 'center',
        });

        doc.moveDown(2);
        doc.fontSize(10).text('Please present this QR code at the entrance', { align: 'center' });
        doc.text(`Valid for: ${ticketData.eventName}`, { align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  async generateEventOfflinePackage(eventData, tickets) {
    const packageData = {
      event_id: eventData.id,
      event_name: eventData.name,
      event_date: eventData.startDate,
      tickets: tickets.map(ticket => ({
        ticket_id: ticket.id,
        signature: ticket.qrSignature,
        status: ticket.isUsed ? 'used' : 'unused',
        owner_name: ticket.owner.username,
        pdf_version: ticket.pdfVersion,
      })),
      blacklisted: eventData.blacklistedTickets || [],
      generated_at: new Date().toISOString(),
    };

    return JSON.stringify(packageData, null, 2);
  }
}

export const pdfService = new PDFService();
