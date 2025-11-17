import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },

  blockchain: {
    rpcUrl: process.env.RPC_URL,
    chainId: process.env.CHAIN_ID,
    privateKey: process.env.PRIVATE_KEY,
    wIDRContract: process.env.WIDR_CONTRACT_ADDRESS,
    ticketNFTContract: process.env.TICKET_NFT_CONTRACT_ADDRESS,
    escrowContract: process.env.ESCROW_CONTRACT_ADDRESS,
    gasLimit: process.env.GAS_LIMIT || '500000',
  },

  treasury: {
    walletAddress: process.env.TREASURY_WALLET_ADDRESS,
  },

  ipfs: {
    gateway: process.env.IPFS_GATEWAY || 'https://ipfs.io/ipfs/',
    apiUrl: process.env.IPFS_API_URL,
    apiKey: process.env.IPFS_API_KEY,
  },

  payment: {
    midtransServerKey: process.env.MIDTRANS_SERVER_KEY,
    midtransClientKey: process.env.MIDTRANS_CLIENT_KEY,
    midtransIsProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  },

  email: {
    resendApiKey: process.env.RESEND_API_KEY,
    from: process.env.EMAIL_FROM || 'MyMineTicketKu <noreply@mymineticketku.com>',
  },

  security: {
    hmacSecret: process.env.HMAC_SECRET,
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 10,
  },

  platform: {
    taxPercentage: 10,
    platformFeePercentage: 2.5,
    maxResalePrice: 120,
    taxEmail: process.env.TAX_RECEIVER_EMAIL || 'pajak@kemenkeu.go.id',
    platformEmail: process.env.PLATFORM_RECEIVER_EMAIL || 'finance@mymineticketku.com',
    taxTransferMethod: process.env.TAX_TRANSFER_METHOD || 'direct',
    platformTransferMethod: process.env.PLATFORM_TRANSFER_METHOD || 'direct',
    taxBankAccount: process.env.TAX_BANK_ACCOUNT,
    taxBankName: process.env.TAX_BANK_NAME,
    taxAccountHolder: process.env.TAX_ACCOUNT_HOLDER,
    platformBankAccount: process.env.PLATFORM_BANK_ACCOUNT,
    platformBankName: process.env.PLATFORM_BANK_NAME,
    platformAccountHolder: process.env.PLATFORM_ACCOUNT_HOLDER,
  },
};