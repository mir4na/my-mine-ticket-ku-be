import midtransClient from 'midtrans-client';
import { config } from '../config/index.js';

class PaymentService {
  constructor() {
    this.snap = new midtransClient.Snap({
      isProduction: config.payment.midtransIsProduction,
      serverKey: config.payment.midtransServerKey,
      clientKey: config.payment.midtransClientKey,
    });
  }

  async createTransaction(orderId, grossAmount, customerDetails) {
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      customer_details: customerDetails,
      enabled_payments: ['bank_transfer', 'gopay', 'qris'],
    };

    try {
      const transaction = await this.snap.createTransaction(parameter);
      return {
        token: transaction.token,
        redirect_url: transaction.redirect_url,
      };
    } catch (error) {
      throw new Error(`Payment creation failed: ${error.message}`);
    }
  }

  async verifyNotification(notification) {
    try {
      const statusResponse = await this.snap.transaction.notification(notification);
      
      const orderId = statusResponse.order_id;
      const transactionStatus = statusResponse.transaction_status;
      const fraudStatus = statusResponse.fraud_status;

      let paymentStatus = 'PENDING';

      if (transactionStatus === 'capture') {
        if (fraudStatus === 'accept') {
          paymentStatus = 'PAID';
        }
      } else if (transactionStatus === 'settlement') {
        paymentStatus = 'PAID';
      } else if (
        transactionStatus === 'cancel' ||
        transactionStatus === 'deny' ||
        transactionStatus === 'expire'
      ) {
        paymentStatus = 'FAILED';
      } else if (transactionStatus === 'pending') {
        paymentStatus = 'PENDING';
      }

      return {
        orderId,
        paymentStatus,
        transactionStatus,
      };
    } catch (error) {
      throw new Error(`Payment verification failed: ${error.message}`);
    }
  }
}

export const paymentService = new PaymentService();
