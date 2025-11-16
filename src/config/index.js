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
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM,
  },

  security: {
    hmacSecret: process.env.HMAC_SECRET,
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 10,
  },

  platform: {
    taxPercentage: 10,
    platformFeePercentage: 2.5,
    maxResalePrice: 120,
  },
};