import dotenv from 'dotenv';

dotenv.config();

export const config = {
  sei: {
    rpcUrl: process.env.SEI_RPC_URL || 'https://evm-rpc-testnet.sei-apis.com',
    chainId: process.env.SEI_CHAIN_ID || '1328',
  },
  contract: {
    address: process.env.VYAN_CONTRACT_ADDRESS || '',
  },
  wallet: {
    privateKey: process.env.PRIVATE_KEY || '',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },
  rebalancing: {
    minAvailableSlots: parseInt(process.env.MIN_AVAILABLE_SLOTS || '3'),
    threshold: parseFloat(process.env.REBALANCING_THRESHOLD || '0.2'),
  },
  monitoring: {
    eventPollingInterval: 30000, // 30 seconds
    rebalancingCheckInterval: 300000, // 5 minutes
  },
};

export const validateConfig = (): void => {
  const required = [
    'SEI_RPC_URL',
    'VYAN_CONTRACT_ADDRESS',
    'PRIVATE_KEY',
    'GEMINI_API_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};
