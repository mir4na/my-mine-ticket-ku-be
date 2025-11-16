import { config } from '../config/index.js';
import blockchainService from './blockchain.service.js';

class TreasuryService {
  constructor() {
    this.walletAddress = config.treasury.walletAddress;
  }

  async mintWIDR(amount) {
    try {
      const txHash = await blockchainService.mintWIDR(this.walletAddress, amount);
      return txHash;
    } catch (error) {
      throw new Error(`wIDR minting failed: ${error.message}`);
    }
  }

  async sendWIDRToEscrow(eventId, buyerAddress, amount, metadataURI) {
    try {
      const result = await blockchainService.purchaseTicket(
        eventId,
        buyerAddress,
        amount,
        metadataURI
      );
      return result;
    } catch (error) {
      throw new Error(`Escrow transfer failed: ${error.message}`);
    }
  }

  async burnWIDRAndTransferIDR(amount, bankAccount) {
    try {
      const burnTxHash = await blockchainService.burnWIDR(amount);
      await this.transferIDRToBank(amount, bankAccount);
      return burnTxHash;
    } catch (error) {
      throw new Error(`wIDR burn and IDR transfer failed: ${error.message}`);
    }
  }

  async transferIDRToBank(amount, bankAccount) {
    return {
      success: true,
      transferId: `TRF-${Date.now()}`,
      amount,
      bankAccount,
    };
  }

  async processWithdrawal(eventId, receiverAddress, custodialWallet, amount, bankAccount) {
    try {
      const withdrawTxHash = await blockchainService.withdraw(
        eventId,
        receiverAddress,
        custodialWallet
      );

      const burnTxHash = await this.burnWIDRAndTransferIDR(amount, bankAccount);

      return {
        withdrawTxHash,
        burnTxHash,
      };
    } catch (error) {
      throw new Error(`Withdrawal processing failed: ${error.message}`);
    }
  }
}

export const treasuryService = new TreasuryService();
