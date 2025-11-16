import nodemailer from 'nodemailer';
import { config } from '../config/index.js';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: {
        user: config.email.user,
        pass: config.email.password,
      },
    });
  }

  async sendEmail(to, subject, html, attachments = []) {
    try {
      const mailOptions = {
        from: config.email.from,
        to,
        subject,
        html,
        attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);
      return info.messageId;
    } catch (error) {
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }

  async sendTicketEmail(to, ticketData, pdfBuffer) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .ticket-info { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Your Ticket for ${ticketData.eventName}</h1>
            </div>
            <div class="content">
              <p>Dear ${ticketData.buyerName},</p>
              <p>Thank you for purchasing a ticket! Here are your ticket details:</p>
              <div class="ticket-info">
                <p><strong>Event:</strong> ${ticketData.eventName}</p>
                <p><strong>Ticket Type:</strong> ${ticketData.ticketType}</p>
                <p><strong>Date:</strong> ${ticketData.eventDate}</p>
                <p><strong>Location:</strong> ${ticketData.eventLocation}</p>
                <p><strong>Ticket ID:</strong> ${ticketData.ticketId}</p>
              </div>
              <p>Your ticket is attached as a PDF. Please present the QR code at the entrance.</p>
              <p>Best regards,<br>MyMineTicketKu Team</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const attachments = [
      {
        filename: `ticket-${ticketData.ticketId}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ];

    return await this.sendEmail(to, `Your Ticket for ${ticketData.eventName}`, html, attachments);
  }

  async sendRevenueApprovalEmail(to, eventData, approvalLink) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .button { background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Revenue Split Approval Required</h1>
            </div>
            <div class="content">
              <p>You have been added as a revenue receiver for the event:</p>
              <h3>${eventData.eventName}</h3>
              <p><strong>Your Share:</strong> ${eventData.percentage}%</p>
              <p>Please click the button below to approve and provide your bank account details:</p>
              <a href="${approvalLink}" class="button">Approve & Setup Bank Account</a>
              <p>If you do not wish to participate, you can reject the invitation through the same link.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return await this.sendEmail(to, 'Revenue Split Approval Required', html);
  }
}

export const emailService = new EmailService();
