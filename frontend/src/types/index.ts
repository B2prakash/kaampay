export interface Contractor {
  id: string;
  email: string;
  name: string;
  wallet: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Worker {
  id: string;
  name: string;
  wallet: string;
  dailyWage: number;
  role?: string;
  contractorId: string;
  createdAt: string;
  updatedAt?: string;
  // UI-only fields (mock may include these)
  status?: 'paid' | 'pending';
}

export interface Payment {
  id: string;
  workerId: string;
  worker?: Worker;
  amount: number;
  txHash?: string;
  dodoId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
}

export interface Invoice {
  id: string;
  amount: number;
  buyerEmail: string;
  sellerEmail: string;
  description?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  escrowId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DashboardStats {
  totalWorkers: number;
  paidToday: number;
  pendingToday: number;
  thisMonth: number;
  recentPayments: Payment[];
  onChain?: {
    totalPaidThisMonth: number;
    transactionCount: number;
    mostPaidWorker: string | null;
  } | null;
}

export interface WalletInfo {
  address: string;
  usdcBalance: number;
  solBalance: number;
  connected: boolean;
}

export interface PayAllResult {
  paid: number;
  failed: number;
  payments: { workerId: string; paymentId: string; paymentLink: string }[];
}

export interface Transaction {
  txHash: string;
  from: string;
  to: string;
  valueUsdc: number;
  timestamp: string;
  status: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}
