import api from './api';

export const covalentClient = {
  getTokenBalances: (walletAddress: string, chainId = 'solana-mainnet') =>
    api.get(`/analytics/balances/${walletAddress}?chainId=${chainId}`),
  getTransactionHistory: (walletAddress: string) =>
    api.get(`/analytics/transactions/${walletAddress}`),
};
