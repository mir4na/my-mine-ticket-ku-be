import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const WIDRJson = JSON.parse(readFileSync(join(__dirname, '../contracts/abi/WIDR.json'), 'utf-8'));
const TicketNFTJson = JSON.parse(readFileSync(join(__dirname, '../contracts/abi/TicketNFT.json'), 'utf-8'));
const EventEscrowJson = JSON.parse(readFileSync(join(__dirname, '../contracts/abi/EventEscrow.json'), 'utf-8'));

const WIDRabi = WIDRJson.abi || WIDRJson;
const TicketNFTabi = TicketNFTJson.abi || TicketNFTJson;
const EventEscrowabi = EventEscrowJson.abi || EventEscrowJson;

class BlockchainService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);
    this.wallet = new ethers.Wallet(config.blockchain.privateKey, this.provider);
    
    this.wIDRContract = new ethers.Contract(
      config.blockchain.wIDRContract,
      WIDRabi,
      this.wallet
    );
    
    this.ticketNFTContract = new ethers.Contract(
      config.blockchain.ticketNFTContract,
      TicketNFTabi,
      this.wallet
    );
    
    this.escrowContract = new ethers.Contract(
      config.blockchain.escrowContract,
      EventEscrowabi,
      this.wallet
    );
  }

  async mintWIDR(toAddress, amount) {
    const amountInWei = ethers.parseUnits(amount.toString(), 18);
    const tx = await this.wIDRContract.mint(toAddress, amountInWei);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async burnWIDR(amount) {
    const amountInWei = ethers.parseUnits(amount.toString(), 18);
    const tx = await this.wIDRContract.burn(amountInWei);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async createEvent(eventId, receivers, percentages) {
    const percentagesInBasisPoints = percentages.map(p => Math.floor(p * 100));
    const tx = await this.escrowContract.createEvent(
      eventId,
      receivers,
      percentagesInBasisPoints
    );
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async purchaseTicket(eventId, buyerAddress, amount, metadataURI) {
    const amountInWei = ethers.parseUnits(amount.toString(), 18);
    
    const approveTx = await this.wIDRContract.approve(
      config.blockchain.escrowContract,
      amountInWei
    );
    await approveTx.wait();

    const tx = await this.escrowContract.purchaseTicket(
      eventId,
      buyerAddress,
      amountInWei,
      metadataURI
    );
    const receipt = await tx.wait();
    
    const event = receipt.logs.find(
      log => log.fragment?.name === 'TicketPurchased'
    );
    
    return {
      txHash: receipt.hash,
      nftTokenId: event?.args?.nftTokenId?.toString(),
    };
  }

  async completeEvent(eventId) {
    const tx = await this.escrowContract.completeEvent(eventId);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async withdraw(eventId, receiverAddress, custodialWallet) {
    const receiverWallet = new ethers.Wallet(receiverAddress, this.provider);
    const escrowWithReceiver = this.escrowContract.connect(receiverWallet);
    
    const tx = await escrowWithReceiver.withdraw(eventId, custodialWallet);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async claimNFT(tokenId, claimerAddress) {
    const tx = await this.escrowContract.claimTicketNFT(tokenId, claimerAddress);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async getReceiverBalance(eventId, receiverAddress) {
    const [balance, withdrawn] = await this.escrowContract.getReceiverBalance(
      eventId,
      receiverAddress
    );
    
    return {
      balance: ethers.formatUnits(balance, 18),
      withdrawn,
    };
  }

  async getEventReceivers(eventId) {
    const [receivers, percentages] = await this.escrowContract.getEventReceivers(eventId);
    
    return receivers.map((receiver, index) => ({
      address: receiver,
      percentage: percentages[index] / 100,
    }));
  }

  async getNFTMetadata(tokenId) {
    const metadataURI = await this.ticketNFTContract.tokenURI(tokenId);
    return metadataURI;
  }

  async getNFTOwner(tokenId) {
    const owner = await this.ticketNFTContract.ownerOf(tokenId);
    return owner;
  }
}

export default new BlockchainService();