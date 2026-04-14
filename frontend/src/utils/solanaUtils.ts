import { Connection, clusterApiUrl, LAMPORTS_PER_SOL } from '@solana/web3.js';

const network = (import.meta.env.VITE_SOLANA_NETWORK as 'devnet' | 'mainnet-beta') || 'devnet';

export const connection = new Connection(
  import.meta.env.VITE_RPC_ENDPOINT || clusterApiUrl(network),
  'confirmed'
);

export const lamportsToSol = (lamports: number) => lamports / LAMPORTS_PER_SOL;

export const solToLamports = (sol: number) => sol * LAMPORTS_PER_SOL;

export const shortenAddress = (address: string, chars = 4) =>
  `${address.slice(0, chars)}...${address.slice(-chars)}`;
