import { ethers } from 'ethers';
import { config } from '../config/index.js';
import blockchainService from './blockchain.service.js';

class TreasuryService {
    constructor() {
        this.walletAddress = config.treasury.walletAddress;
    }

    calculateSplit(grossAmount) {
        const platformFee = Math.floor((grossAmount * config.platform.platformFeePercentage) / 100);
        const netAmount = grossAmount - platformFee;

        return {
            grossAmount,
            platformFee,
            netAmount,
        };
    }

    async transferToPlatform(platformFee) {
        if (config.platform.platformTransferMethod === 'direct') {
            return await this.transferIDRToBank(platformFee, {
                bankName: config.platform.platformBankName,
                accountNumber: config.platform.platformBankAccount,
                accountHolder: config.platform.platformAccountHolder,
            });
        } else {
            return {
                method: 'hold',
                amount: platformFee,
                note: 'Held in treasury for later withdrawal',
            };
        }
    }

    async transferIDRToBank(amount, bankAccount) {
        return {
            success: true,
            method: 'bank_transfer',
            transferId: `TRF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            amount,
            bankAccount,
            timestamp: new Date().toISOString(),
        };
    }

    async mintWIDRForTicket(netAmount) {
        try {
            return await blockchainService.mintWIDR(this.walletAddress, netAmount);
        } catch (error) {
            throw new Error(`wIDR minting failed: ${error.message}`);
        }
    }

    async sendWIDRToEscrow(eventId, buyerAddress, netAmount, metadataURI) {
        try {
            return await blockchainService.purchaseTicket(
                eventId,
                buyerAddress,
                netAmount,
                metadataURI
            );
        } catch (error) {
            throw new Error(`Escrow transfer failed: ${error.message}`);
        }
    }

    async processTicketPurchase(eventId, buyerAddress, grossAmount, metadataURI) {
        const { platformFee, netAmount } = this.calculateSplit(grossAmount);

        const platformTransfer = await this.transferToPlatform(platformFee);

        const mintTxHash = await this.mintWIDRForTicket(netAmount);

        const { txHash, nftTokenId } = await this.sendWIDRToEscrow(
            eventId,
            buyerAddress,
            netAmount,
            metadataURI
        );

        return {
            grossAmount,
            platformFee,
            netAmount,
            platformTransfer,
            mintTxHash,
            escrowTxHash: txHash,
            nftTokenId,
        };
    }

    async processResalePayment(eventId, sellerAmount, resaleFee, platformFee, sellerEmail) {
        const platformTransfer = await this.transferToPlatform(platformFee);

        const sellerTransfer = await this.transferIDRToBank(sellerAmount, {
            bankName: 'Seller Bank',
            accountNumber: 'SELLER_ACCOUNT',
            accountHolder: sellerEmail,
        });

        const resaleFeeTransfer = {
            method: 'escrow',
            amount: resaleFee,
            note: 'Resale fee added to event revenue split',
        };

        return {
            platformTransfer,
            sellerTransfer,
            resaleFeeTransfer
        };
    }

    async burnWIDRAndTransferIDR(amount, bankAccount) {
        try {
            const burnTxHash = await blockchainService.burnWIDR(amount);
            const idrTransfer = await this.transferIDRToBank(amount, bankAccount);

            return { burnTxHash, idrTransfer };
        } catch (error) {
            throw new Error(`wIDR burn and IDR transfer failed: ${error.message}`);
        }
    }

    async processWithdrawal(eventId, receiverPrivateKey, custodialWallet, amount, bankAccount) {
        try {
            const provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);
            const receiverWallet = new ethers.Wallet(receiverPrivateKey, provider);
            
            const escrowContract = new ethers.Contract(
                config.blockchain.escrowContract,
                blockchainService.escrowContract.interface,
                receiverWallet
            );

            const withdrawTx = await escrowContract.withdraw(eventId, custodialWallet);
            const withdrawReceipt = await withdrawTx.wait();

            const { burnTxHash, idrTransfer } = await this.burnWIDRAndTransferIDR(amount, bankAccount);

            return {
                withdrawTxHash: withdrawReceipt.hash,
                burnTxHash,
                idrTransfer,
            };
        } catch (error) {
            throw new Error(`Withdrawal processing failed: ${error.message}`);
        }
    }
}

export const treasuryService = new TreasuryService();