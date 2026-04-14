import axios, { AxiosError } from 'axios';
import type {
  Worker,
  Invoice,
  DashboardStats,
  PayAllResult,
  Transaction,
} from '../types';

// ── Axios instance ────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// Request interceptor — attach wallet address from localStorage if present
api.interceptors.request.use((config) => {
  const wallet = localStorage.getItem('walletAddress');
  if (wallet) {
    config.headers['x-wallet-address'] = wallet;
  }
  return config;
});

// Response interceptor — normalise errors
api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ status: string; message: string; errors?: any[] }>) => {
    const message =
      err.response?.data?.message ?? err.message ?? 'Something went wrong';
    return Promise.reject(new Error(message));
  },
);

// ── Workers ───────────────────────────────────────────────────────────────────
export async function getWorkers(contractorId?: string): Promise<Worker[]> {
  const params = contractorId ? { contractorId } : {};
  const { data } = await api.get<{ workers: Worker[] }>('/api/workers', { params });
  return data.workers;
}

export async function addWorker(payload: {
  name: string;
  wallet: string;
  dailyWage: number;
  role?: string;
  contractorId: string;
}): Promise<Worker> {
  const { data } = await api.post<{ worker: Worker }>('/api/workers', payload);
  return data.worker;
}

export async function deleteWorker(id: string): Promise<void> {
  await api.delete(`/api/workers/${id}`);
}

// ── Payments ──────────────────────────────────────────────────────────────────
export async function payWorker(
  workerId: string,
  amount: number,
): Promise<{ paymentId: string; paymentLink: string; paymentDbId: string }> {
  const { data } = await api.post('/api/payments/pay-worker', { workerId, amount });
  return data;
}

export async function payAllWorkers(contractorId: string): Promise<PayAllResult> {
  const { data } = await api.post<PayAllResult>('/api/payments/pay-all', { contractorId });
  return data;
}

export async function getPaymentHistory(walletAddress: string): Promise<Transaction[]> {
  const { data } = await api.get<{ transactions: Transaction[] }>('/api/payments/history', {
    params: { walletAddress },
  });
  return data.transactions;
}

// ── Invoices ──────────────────────────────────────────────────────────────────
export async function createInvoice(payload: {
  amount: number;
  buyerEmail: string;
  sellerEmail: string;
  description?: string;
}): Promise<Invoice> {
  const { data } = await api.post<{ invoice: Invoice }>('/api/invoices', payload);
  return data.invoice;
}

export async function getInvoices(): Promise<Invoice[]> {
  const { data } = await api.get<{ invoices: Invoice[] }>('/api/invoices');
  return data.invoices;
}

export async function confirmInvoice(id: string): Promise<Invoice> {
  const { data } = await api.put<{ invoice: Invoice }>(`/api/invoices/${id}/confirm`);
  return data.invoice;
}

export async function releaseInvoice(id: string): Promise<Invoice> {
  const { data } = await api.put<{ invoice: Invoice }>(`/api/invoices/${id}/release`);
  return data.invoice;
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export async function getDashboardStats(params?: {
  contractorId?: string;
  contractorWallet?: string;
}): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>('/api/analytics/dashboard', { params });
  return data;
}

export default api;
