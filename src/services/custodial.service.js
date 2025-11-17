import { ethers } from 'ethers';
import crypto from 'crypto';
import { config } from '../config/index.js';

class CustodialService {
  constructor() {
    this.wallets = new Map();
  }

  generateCustodialWallet(userEmail) {
    const seed = `${config.security.hmacSecret}-${userEmail}`;
    const hash = crypto.createHash('sha256').update(seed).digest('hex');
    const privateKey = '0x' + hash;
    
    const wallet = new ethers.Wallet(privateKey);
    
    this.wallets.set(userEmail, {
      address: wallet.address,
      privateKey: wallet.privateKey,
    });
    
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
    };
  }

  getCustodialWallet(userEmail) {
    if (this.wallets.has(userEmail)) {
      return this.wallets.get(userEmail);
    }
    
    return this.generateCustodialWallet(userEmail);
  }

  getCustodialAddress(userEmail) {
    const wallet = this.getCustodialWallet(userEmail);
    return wallet.address;
  }
}

export const custodialService = new CustodialService();