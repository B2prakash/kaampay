/**
 * KaamPay — Solana hooks
 *
 * Built on top of @solana/wallet-adapter-react (already installed).
 * SPL-token transfers use @solana/spl-token for ATA lookup + instruction building.
 * On-chain reads use @solana/web3.js Connection directly.
 *
 * Skill note: the solana-dev skill prefers framework-kit (@solana/client +
 * @solana/react-hooks) for greenfield projects. Since this project already has
 * wallet-adapter installed and the user spec calls for ConnectionProvider /
 * WalletProvider / WalletModalProvider, we use wallet-adapter here and contain
 * the @solana/web3.js boundary to this file only.
 */
import { useState, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import {
  PublicKey,
  LAMPORTS_PER_SOL,
  Transaction,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  getMint,
  getAccount,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { getPaymentHistory } from '../utils/api';
import type { Transaction as KaamTx } from '../types';

// USDC mint on devnet
const USDC_MINT_DEVNET = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');

// ── useWalletConnection ───────────────────────────────────────────────────────
export interface WalletConnectionState {
  connected: boolean;
  publicKey: PublicKey | null;
  balanceSol: number;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  walletName: string | null;
}

export function useWalletConnection(): WalletConnectionState {
  const { connected, publicKey, connect, disconnect, wallet } = useWallet();
  const { connection } = useConnection();
  const [balanceSol, setBalanceSol] = useState(0);

  useEffect(() => {
    if (!connected || !publicKey) {
      setBalanceSol(0);
      return;
    }

    let cancelled = false;

    const fetchBalance = async () => {
      try {
        const lamports = await connection.getBalance(publicKey);
        if (!cancelled) setBalanceSol(lamports / LAMPORTS_PER_SOL);
      } catch {
        // swallow — connection may not be ready
      }
    };

    fetchBalance();

    // Subscribe to balance changes
    const subId = connection.onAccountChange(publicKey, (info) => {
      if (!cancelled) setBalanceSol(info.lamports / LAMPORTS_PER_SOL);
    });

    return () => {
      cancelled = true;
      connection.removeAccountChangeListener(subId);
    };
  }, [connected, publicKey, connection]);

  // Persist wallet address for API interceptor
  useEffect(() => {
    if (publicKey) {
      localStorage.setItem('walletAddress', publicKey.toBase58());
    } else {
      localStorage.removeItem('walletAddress');
    }
  }, [publicKey]);

  const handleConnect = useCallback(async () => {
    try {
      await connect();
    } catch (err: any) {
      if (err?.name !== 'WalletNotSelectedError') throw err;
    }
  }, [connect]);

  return {
    connected,
    publicKey,
    balanceSol,
    connect: handleConnect,
    disconnect,
    walletName: wallet?.adapter.name ?? null,
  };
}

// ── useUSDCBalance ────────────────────────────────────────────────────────────
export interface USDCBalanceState {
  balance: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useUSDCBalance(walletAddress: string | null): USDCBalanceState {
  const { connection } = useConnection();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!walletAddress) {
      setBalance(0);
      return;
    }

    let cancelled = false;

    const fetchBalance = async () => {
      setLoading(true);
      setError(null);
      try {
        const owner = new PublicKey(walletAddress);
        const ata = await getAssociatedTokenAddress(USDC_MINT_DEVNET, owner);

        // Get mint decimals
        const mintInfo = await getMint(connection, USDC_MINT_DEVNET);
        const decimals = mintInfo.decimals;

        const tokenAccount = await getAccount(connection, ata).catch(() => null);
        if (!cancelled) {
          setBalance(
            tokenAccount
              ? Number(tokenAccount.amount) / Math.pow(10, decimals)
              : 0,
          );
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? 'Failed to fetch USDC balance');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchBalance();
    return () => { cancelled = true; };
  }, [walletAddress, connection, tick]);

  return { balance, loading, error, refetch };
}

// ── useSendUSDC ───────────────────────────────────────────────────────────────
export interface SendUSDCState {
  sendUSDC: (toAddress: string, amount: number) => Promise<string>;
  loading: boolean;
  txHash: string | null;
  error: string | null;
}

export function useSendUSDC(): SendUSDCState {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendUSDC = useCallback(
    async (toAddress: string, amount: number): Promise<string> => {
      if (!publicKey) throw new Error('Wallet not connected');

      setLoading(true);
      setError(null);
      setTxHash(null);

      try {
        const toPubkey = new PublicKey(toAddress);
        const mintInfo = await getMint(connection, USDC_MINT_DEVNET);
        const decimals = mintInfo.decimals;
        const rawAmount = BigInt(Math.round(amount * Math.pow(10, decimals)));

        const fromATA = await getAssociatedTokenAddress(USDC_MINT_DEVNET, publicKey);
        const toATA = await getAssociatedTokenAddress(USDC_MINT_DEVNET, toPubkey);

        const ix = createTransferInstruction(
          fromATA,
          toATA,
          publicKey,
          rawAmount,
          [],
          TOKEN_PROGRAM_ID,
        );

        const tx = new Transaction().add(ix);
        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash('confirmed');
        tx.recentBlockhash = blockhash;
        tx.feePayer = publicKey;

        const sig = await sendTransaction(tx, connection);

        // Wait for confirmation
        await connection.confirmTransaction(
          { signature: sig, blockhash, lastValidBlockHeight },
          'confirmed',
        );

        setTxHash(sig);
        return sig;
      } catch (err: any) {
        const msg = err?.message ?? 'Transaction failed';
        setError(msg);
        throw new Error(msg);
      } finally {
        setLoading(false);
      }
    },
    [publicKey, sendTransaction, connection],
  );

  return { sendUSDC, loading, txHash, error };
}

// ── useTransactionHistory ─────────────────────────────────────────────────────
export interface TransactionHistoryState {
  transactions: KaamTx[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTransactionHistory(
  walletAddress: string | null,
): TransactionHistoryState {
  const [transactions, setTransactions] = useState<KaamTx[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!walletAddress) {
      setTransactions([]);
      return;
    }

    let cancelled = false;

    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const txns = await getPaymentHistory(walletAddress);
        if (!cancelled) setTransactions(txns);
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? 'Failed to fetch history');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetch();
    return () => { cancelled = true; };
  }, [walletAddress, tick]);

  return { transactions, loading, error, refetch };
}
