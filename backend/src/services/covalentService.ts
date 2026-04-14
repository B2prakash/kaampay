import axios from 'axios';

const COVALENT_BASE = 'https://api.covalenthq.com/v1';
const API_KEY = process.env.COVALENT_API_KEY ?? '';

const covalentAxios = axios.create({
  baseURL: COVALENT_BASE,
  auth: { username: API_KEY, password: '' },
});

export interface Transaction {
  txHash: string;
  from: string;
  to: string;
  valueUsdc: number;
  timestamp: string;
  status: string;
}

export interface WalletBalance {
  usdc: number;
  sol: number;
}

export interface DashboardStats {
  totalPaidThisMonth: number;
  transactionCount: number;
  mostPaidWorker: string | null;
}

/**
 * Returns formatted transaction list for a Solana wallet.
 */
export async function getWalletTransactions(walletAddress: string): Promise<Transaction[]> {
  try {
    const { data } = await covalentAxios.get(
      `/solana-mainnet/address/${walletAddress}/transactions_v3/`,
    );

    const items: any[] = data?.data?.items ?? [];
    return items.map((item: any) => ({
      txHash: item.tx_hash ?? '',
      from: item.from_address ?? '',
      to: item.to_address ?? '',
      valueUsdc: parseFloat(item.value ?? '0') / 1e6,
      timestamp: item.block_signed_at ?? '',
      status: item.successful ? 'success' : 'failed',
    }));
  } catch (err: any) {
    console.error('[Covalent] getWalletTransactions error:', err?.message);
    return [];
  }
}

/**
 * Returns USDC and SOL balances for a wallet.
 */
export async function getWalletBalance(walletAddress: string): Promise<WalletBalance> {
  try {
    const { data } = await covalentAxios.get(
      `/solana-mainnet/address/${walletAddress}/balances_v2/`,
    );

    const items: any[] = data?.data?.items ?? [];
    let usdc = 0;
    let sol = 0;

    for (const item of items) {
      const symbol: string = (item.contract_ticker_symbol ?? '').toUpperCase();
      const balance = parseFloat(item.balance ?? '0') / Math.pow(10, item.contract_decimals ?? 0);

      if (symbol === 'USDC') usdc = balance;
      if (symbol === 'SOL') sol = balance;
    }

    return { usdc, sol };
  } catch (err: any) {
    console.error('[Covalent] getWalletBalance error:', err?.message);
    return { usdc: 0, sol: 0 };
  }
}

/**
 * Aggregates dashboard stats from on-chain transactions.
 */
export async function getDashboardStats(contractorWallet: string): Promise<DashboardStats> {
  try {
    const txns = await getWalletTransactions(contractorWallet);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthTxns = txns.filter((t) => new Date(t.timestamp) >= startOfMonth);

    const totalPaidThisMonth = monthTxns.reduce((sum, t) => sum + t.valueUsdc, 0);
    const transactionCount = monthTxns.length;

    // Most paid worker = most frequent recipient this month
    const recipientCounts: Record<string, number> = {};
    for (const t of monthTxns) {
      if (t.to) recipientCounts[t.to] = (recipientCounts[t.to] ?? 0) + t.valueUsdc;
    }
    const mostPaidWorker =
      Object.entries(recipientCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    return { totalPaidThisMonth, transactionCount, mostPaidWorker };
  } catch (err: any) {
    console.error('[Covalent] getDashboardStats error:', err?.message);
    return { totalPaidThisMonth: 0, transactionCount: 0, mostPaidWorker: null };
  }
}
