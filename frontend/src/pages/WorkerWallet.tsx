import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import QRCode from 'react-qr-code';
import toast from 'react-hot-toast';
import {
  Wallet, CreditCard, Send, Clock, HelpCircle,
  Copy, Check, Download, ExternalLink, Loader2,
  MessageCircle, X, ChevronRight, Zap, LogOut,
} from 'lucide-react';
import {
  useWalletConnection,
  useUSDCBalance,
  useSendUSDC,
  useTransactionHistory,
} from '../hooks/useSolana';

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:       '#060B14',
  bgMain:   '#080D18',
  primary:  '#F59E0B',
  text:     '#F0EDE8',
  muted:    'rgba(240,237,232,0.5)',
  muted2:   'rgba(240,237,232,0.25)',
  cardBg:   'rgba(255,255,255,0.03)',
  border:   'rgba(255,255,255,0.08)',
  border2:  'rgba(255,255,255,0.05)',
  green:    '#34D399',
  red:      '#F87171',
} as const;

const FS   = 'Syne, sans-serif';
const FD   = 'DM Sans, sans-serif';
const EASE = [0.16, 1, 0.3, 1] as const;

type WorkerTab = 'wallet' | 'payments' | 'send' | 'history' | 'help';

const WORKER_NAV: { label: string; icon: React.ReactNode; tab: WorkerTab }[] = [
  { label: 'My Wallet',  icon: <Wallet size={16} />,     tab: 'wallet'   },
  { label: 'Payments',   icon: <CreditCard size={16} />, tab: 'payments' },
  { label: 'Send Money', icon: <Send size={16} />,        tab: 'send'     },
  { label: 'History',    icon: <Clock size={16} />,       tab: 'history'  },
  { label: 'Help',       icon: <HelpCircle size={16} />, tab: 'help'     },
];

function WorkerSidebar({
  walletAddress, connected, activeTab, setActiveTab,
}: {
  walletAddress: string | null;
  connected: boolean;
  activeTab: WorkerTab;
  setActiveTab: (t: WorkerTab) => void;
}) {
  const navigate = useNavigate();
  const user = (() => { try { return JSON.parse(localStorage.getItem('kp_user') ?? '{}'); } catch { return {}; } })();
  const short = walletAddress
    ? `${walletAddress.slice(0, 5)}...${walletAddress.slice(-4)}`
    : 'Not connected';

  const handleLogout = () => {
    localStorage.removeItem('kp_user');
    toast.success('Logged out');
    navigate('/login?type=worker');
  };

  return (
    <aside style={{
      position: 'fixed', top: 0, left: 0, bottom: 0,
      width: 240, background: C.bg,
      borderRight: `1px solid ${C.border}`,
      display: 'flex', flexDirection: 'column',
      zIndex: 50,
    }}>
      <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${C.border2}` }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
          <span style={{ fontFamily: FS, fontWeight: 800, fontSize: 18, color: C.text, letterSpacing: '-0.3px' }}>
            KaamPay
          </span>
          <span className="pulse-dot" />
        </Link>
        <p style={{ fontFamily: FD, fontSize: 11, color: C.muted, marginTop: 6 }}>Worker Portal</p>
      </div>

      <nav style={{ padding: '16px 8px', flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {WORKER_NAV.map(item => {
          const isActive = activeTab === item.tab;
          return (
            <button
              key={item.label}
              onClick={() => setActiveTab(item.tab)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                borderLeft: isActive ? `3px solid ${C.primary}` : '3px solid transparent',
                background: isActive ? 'rgba(245,158,11,0.1)' : 'transparent',
                color:      isActive ? C.primary : C.muted,
                fontFamily: FD, fontSize: 14,
                fontWeight: isActive ? 500 : 400,
                textAlign: 'left',
                transition: 'background 0.18s, color 0.18s, border-color 0.18s',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = C.text; } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.muted; } }}
            >
              <span style={{ display: 'flex', flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: '12px', borderTop: `1px solid ${C.border2}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', borderRadius: 8,
          background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`,
        }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: '#7C3AED',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: FS, fontWeight: 700, fontSize: 12, color: '#fff',
            }}>
              {(user?.name ?? 'W').slice(0, 2).toUpperCase()}
            </div>
            {connected && (
              <span style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 8, height: 8, borderRadius: '50%',
                background: C.green, border: `1.5px solid ${C.bg}`,
              }} />
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontFamily: FD, fontSize: 12, color: C.text, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name ?? 'Worker'}
            </p>
            <p style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, color: C.muted2, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {short}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'transparent', color: C.muted,
            fontFamily: FD, fontSize: 13, textAlign: 'left',
            transition: 'background 0.18s, color 0.18s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; e.currentTarget.style.color = '#F87171'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.muted; }}
        >
          <LogOut size={14} /> Logout
        </button>
      </div>
    </aside>
  );
}

// ─── Section 1: Wallet Header Card ────────────────────────────────────────────
function WalletHeaderCard({
  balance,
  balanceLoading,
  walletAddress,
  onConnect,
  connected,
}: {
  balance: number;
  balanceLoading: boolean;
  walletAddress: string | null;
  onConnect: () => void;
  connected: boolean;
}) {
  const inrRate = 83.3;
  const inrValue = (balance * inrRate).toFixed(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      style={{
        position: 'relative', overflow: 'hidden',
        background: 'rgba(245,158,11,0.04)',
        border: '1px solid rgba(245,158,11,0.18)',
        borderRadius: 16, padding: '32px 36px',
        marginBottom: 20,
      }}
    >
      <div style={{
        position: 'absolute', top: '-40%', right: '-10%',
        width: 340, height: 340, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24, position: 'relative' }}>
        <div>
          <p style={{ fontFamily: FD, fontSize: 16, color: C.muted, marginBottom: 8 }}>
            Namaste, Suresh Kumar 👋
          </p>
          <p style={{ fontFamily: FD, fontSize: 12, color: C.muted2, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Your Balance
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
            {balanceLoading ? (
              <Loader2 size={40} style={{ color: C.primary, animation: 'spin 1s linear infinite' }} />
            ) : (
              <>
                <span style={{ fontFamily: FS, fontWeight: 800, fontSize: 64, color: C.primary, letterSpacing: '-2px', lineHeight: 1 }}>
                  {connected ? balance.toFixed(2) : '—'}
                </span>
                <span style={{ fontFamily: FS, fontWeight: 600, fontSize: 24, color: C.muted }}>USDC</span>
              </>
            )}
          </div>
          {connected && !balanceLoading && (
            <p style={{ fontFamily: FD, fontSize: 16, color: C.muted, marginBottom: 6 }}>
              ≈ ₹{inrValue} INR
            </p>
          )}
          <p style={{ fontFamily: FD, fontSize: 13, color: C.muted2 }}>
            {connected
              ? `Wallet: ${walletAddress?.slice(0, 8)}...${walletAddress?.slice(-6)}`
              : 'Connect your Solana wallet to see your balance'}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 200 }}>
          {!connected ? (
            <button
              onClick={onConnect}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                background: C.primary, color: '#060B14',
                padding: '14px 24px', borderRadius: 10,
                fontSize: 15, fontWeight: 600, fontFamily: FD, cursor: 'pointer',
                border: 'none', transition: 'opacity 0.18s, transform 0.18s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.86'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <Wallet size={16} /> Connect Wallet
            </button>
          ) : (
            <>
              <button style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                background: C.primary, color: '#060B14',
                padding: '14px 24px', borderRadius: 10,
                fontSize: 15, fontWeight: 600, fontFamily: FD, cursor: 'pointer',
                border: 'none', transition: 'opacity 0.18s, transform 0.18s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.86'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                📤 Send to Family
              </button>
              <button style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                background: 'transparent', border: `1px solid ${C.border}`, color: C.text,
                padding: '14px 24px', borderRadius: 10,
                fontSize: 15, fontWeight: 400, fontFamily: FD, cursor: 'pointer',
                transition: 'border-color 0.18s, transform 0.18s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.24)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                📥 Receive
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Section 2: Week Summary ───────────────────────────────────────────────────
function WeekSummary({ usdcBalance }: { usdcBalance: number }) {
  const inrRate = 83.3;
  const stats = [
    { label: 'Earned this week', value: `${usdcBalance.toFixed(1)} USDC`, sub: `≈ ₹${(usdcBalance * inrRate).toFixed(0)} INR`, color: C.green },
    { label: 'Days worked',      value: '6 days',   sub: 'Mon – Sat',   color: '#A78BFA' },
    { label: 'Next payment',     value: 'Tomorrow', sub: '6:00 PM',     color: C.primary },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 + i * 0.08, ease: EASE }}
          style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 22px' }}
        >
          <p style={{ fontFamily: FD, fontSize: 12, color: C.muted, marginBottom: 10, letterSpacing: '0.02em' }}>{s.label}</p>
          <p style={{ fontFamily: FS, fontWeight: 700, fontSize: 26, color: s.color, letterSpacing: '-0.5px', marginBottom: 4 }}>{s.value}</p>
          <p style={{ fontFamily: FD, fontSize: 12, color: C.muted2 }}>{s.sub}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Section 3: QR Code Card ───────────────────────────────────────────────────
function QRCard({ walletAddress }: { walletAddress: string }) {
  const [copied, setCopied] = useState(false);
  const short = `${walletAddress.slice(0, 5)}...${walletAddress.slice(-4)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.22, ease: EASE }}
      style={{
        background: C.cardBg, border: `1px solid ${C.border}`,
        borderRadius: 16, padding: '28px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
      }}
    >
      <h3 style={{ fontFamily: FS, fontWeight: 700, fontSize: 17, color: C.text, marginBottom: 6 }}>
        Your Payment QR Code
      </h3>
      <p style={{ fontFamily: FD, fontSize: 13, color: C.muted, marginBottom: 24, maxWidth: 260, lineHeight: 1.55 }}>
        Show this to your contractor to receive payment instantly
      </p>

      <div style={{
        background: '#fff', padding: 16, borderRadius: 12,
        display: 'inline-block', marginBottom: 20,
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}>
        <QRCode value={walletAddress} size={168} level="M" />
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`,
        borderRadius: 8, padding: '8px 14px',
        marginBottom: 14, width: '100%',
      }}>
        <span style={{ fontFamily: 'ui-monospace, Consolas, monospace', fontSize: 12, color: C.muted, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {short}
        </span>
        <button
          onClick={handleCopy}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: copied ? C.green : C.muted,
            display: 'flex', alignItems: 'center', gap: 4,
            fontFamily: FD, fontSize: 12, transition: 'color 0.18s', padding: 0,
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <button style={{
        display: 'flex', alignItems: 'center', gap: 7,
        background: 'transparent', border: `1px solid ${C.border}`,
        color: C.muted, padding: '9px 20px', borderRadius: 8,
        fontSize: 13, fontFamily: FD, cursor: 'pointer',
        transition: 'border-color 0.18s, color 0.18s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; e.currentTarget.style.color = C.text; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
      >
        <Download size={14} /> Download QR
      </button>
    </motion.div>
  );
}

// ─── Section 4: Send to Family ─────────────────────────────────────────────────
function SendToFamily({ connected, usdcBalance }: { connected: boolean; usdcBalance: number }) {
  const { sendUSDC, loading: sending } = useSendUSDC();
  const [amount, setAmount]       = useState('');
  const [recipient, setRecipient] = useState('');
  const [confirm, setConfirm]     = useState(false);

  const usdcFee = 0.001;
  const bankFee = 325;
  const saved   = (bankFee - usdcFee * 83.3).toFixed(2);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px',
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${C.border}`,
    borderRadius: 8, color: C.text,
    fontFamily: FD, fontSize: 15,
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.18s',
  };

  const handleSend = async () => {
    if (!amount || !recipient) {
      toast.error('Enter amount and wallet address.');
      return;
    }
    if (parseFloat(amount) > usdcBalance) {
      toast.error('Insufficient USDC balance.');
      return;
    }
    if (!confirm) {
      setConfirm(true);
      return;
    }
    // Confirmed — execute
    setConfirm(false);
    try {
      const sig = await sendUSDC(recipient, parseFloat(amount));
      const explorerUrl = `https://explorer.solana.com/tx/${sig}?cluster=devnet`;
      toast.success(
        `Sent ${amount} USDC! View on Explorer`,
        { duration: 6000 }
      );
      // Open explorer in new tab
      window.open(explorerUrl, '_blank', 'noreferrer');
      setAmount('');
      setRecipient('');
    } catch (err: any) {
      toast.error(err?.message ?? 'Transaction failed. Try again.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.3, ease: EASE }}
      style={{
        background: C.cardBg, border: `1px solid ${C.border}`,
        borderRadius: 16, padding: '28px',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}
    >
      <div>
        <h3 style={{ fontFamily: FS, fontWeight: 700, fontSize: 17, color: C.text, marginBottom: 4 }}>
          Send Money Home
        </h3>
        <p style={{ fontFamily: FD, fontSize: 13, color: C.muted }}>
          0.1% fee · Arrives in ~2 seconds
        </p>
      </div>

      <div>
        <label style={{ display: 'block', fontFamily: FD, fontSize: 12, color: C.muted, marginBottom: 7 }}>
          Amount (USDC) {connected && <span style={{ color: C.muted2 }}>· Balance: {usdcBalance.toFixed(2)}</span>}
        </label>
        <input
          value={amount}
          onChange={e => { setAmount(e.target.value); setConfirm(false); }}
          type="number" placeholder="Enter USDC amount" style={inputStyle}
          onFocus={e => (e.target.style.borderColor = 'rgba(245,158,11,0.5)')}
          onBlur={e => (e.target.style.borderColor = C.border)}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontFamily: FD, fontSize: 12, color: C.muted, marginBottom: 7 }}>
          Family Wallet Address (Solana)
        </label>
        <input
          value={recipient}
          onChange={e => { setRecipient(e.target.value); setConfirm(false); }}
          placeholder="Family wallet address"
          style={{ ...inputStyle, fontFamily: 'ui-monospace, Consolas, monospace', fontSize: 13 }}
          onFocus={e => (e.target.style.borderColor = 'rgba(245,158,11,0.5)')}
          onBlur={e => (e.target.style.borderColor = C.border)}
        />
      </div>

      {/* Fee comparison */}
      <div style={{
        background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.18)',
        borderRadius: 10, padding: '14px 16px',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: FD, fontSize: 13, color: C.muted }}>Transaction Fee</span>
          <span style={{ fontFamily: FS, fontWeight: 600, fontSize: 13, color: C.text }}>{usdcFee} USDC</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: FD, fontSize: 13, color: C.muted }}>vs Bank Transfer</span>
          <span style={{ fontFamily: FD, fontSize: 13, color: C.red }}>₹{bankFee} fee</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid rgba(52,211,153,0.15)' }}>
          <span style={{ fontFamily: FD, fontSize: 14, color: C.green, fontWeight: 600 }}>You save</span>
          <span style={{ fontFamily: FS, fontWeight: 700, fontSize: 16, color: C.green }}>₹{saved}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <Zap size={14} style={{ color: C.primary, flexShrink: 0 }} />
        <span style={{ fontFamily: FD, fontSize: 13, color: C.muted }}>Arrives in ~2 seconds</span>
      </div>

      {/* Confirm dialog inline */}
      {confirm && (
        <div style={{
          background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 10, padding: '14px 16px',
        }}>
          <p style={{ fontFamily: FD, fontSize: 14, color: C.text, marginBottom: 4, fontWeight: 500 }}>
            Confirm Transaction
          </p>
          <p style={{ fontFamily: FD, fontSize: 13, color: C.muted }}>
            Sending <strong style={{ color: C.primary }}>{amount} USDC</strong> to{' '}
            <span style={{ fontFamily: 'ui-monospace, monospace' }}>
              {recipient.length > 12 ? `${recipient.slice(0, 6)}…${recipient.slice(-4)}` : recipient}
            </span>
          </p>
          <p style={{ fontFamily: FD, fontSize: 12, color: C.muted2, marginTop: 6 }}>
            This action cannot be undone. Tap "Send Now" again to confirm.
          </p>
        </div>
      )}

      <button
        onClick={handleSend}
        disabled={sending || !connected}
        style={{
          width: '100%', padding: '14px',
          background: confirm ? C.green : (sending ? 'rgba(245,158,11,0.5)' : C.primary),
          color: '#060B14', borderRadius: 10, border: 'none',
          fontSize: 15, fontWeight: 600, fontFamily: FD,
          cursor: (sending || !connected) ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'background 0.2s, transform 0.18s',
          opacity: !connected ? 0.5 : 1,
        }}
        onMouseEnter={e => { if (!sending && connected) e.currentTarget.style.transform = 'translateY(-1px)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        {sending
          ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Sending on Solana…</>
          : confirm ? '✅ Confirm Send' : '📤 Send Now'
        }
      </button>

      {!connected && (
        <p style={{ fontFamily: FD, fontSize: 12, color: C.muted2, textAlign: 'center' }}>
          Connect wallet to send USDC
        </p>
      )}

      <p style={{ fontFamily: FD, fontSize: 11, color: C.muted2, textAlign: 'center', lineHeight: 1.5 }}>
        Powered by Solana + Umbra Privacy
      </p>
    </motion.div>
  );
}

// ─── Section 5: Payment History ────────────────────────────────────────────────
type FilterKey = 'all' | 'week' | 'month';

function PaymentHistory({ walletAddress }: { walletAddress: string | null }) {
  const { transactions, loading } = useTransactionHistory(walletAddress);
  const [filter, setFilter] = useState<FilterKey>('all');

  // Filter transactions
  const now = new Date();
  const filtered = transactions.filter(tx => {
    if (filter === 'all') return true;
    const date = new Date(tx.timestamp);
    if (filter === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo;
    }
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return date >= monthAgo;
  });

  // Fallback mock data when wallet not connected
  const MOCK_PAYMENTS = [
    { type: 'received', date: 'Today 6:00 PM',     amount: 6,  source: 'Rajesh Contractors', hash: '' },
    { type: 'received', date: 'Yesterday 6:00 PM', amount: 6,  source: 'Rajesh Contractors', hash: '' },
    { type: 'received', date: '2 days ago',        amount: 6,  source: 'Rajesh Contractors', hash: '' },
    { type: 'sent',     date: '3 days ago',        amount: 12, source: 'Sent to Family',     hash: '' },
    { type: 'received', date: '4 days ago',        amount: 6,  source: 'Rajesh Contractors', hash: '' },
  ];

  const showMock = !walletAddress;
  const rows = showMock ? MOCK_PAYMENTS : filtered.map(tx => ({
    type: tx.from.toLowerCase() === walletAddress?.toLowerCase() ? 'sent' : 'received',
    date: new Date(tx.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
    amount: tx.valueUsdc,
    source: tx.from.length > 10 ? `${tx.from.slice(0, 6)}…${tx.from.slice(-4)}` : tx.from,
    hash: tx.txHash,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.36, ease: EASE }}
      style={{
        background: C.cardBg, border: `1px solid ${C.border}`,
        borderRadius: 16, overflow: 'hidden', marginTop: 20,
      }}
    >
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 24px', borderBottom: `1px solid ${C.border}`,
        flexWrap: 'wrap', gap: 12,
      }}>
        <h3 style={{ fontFamily: FS, fontWeight: 700, fontSize: 16, color: C.text }}>
          Payment History
        </h3>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['all', 'week', 'month'] as const).map(key => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: filter === key ? 'rgba(245,158,11,0.12)' : 'transparent',
                color:      filter === key ? C.primary : C.muted,
                fontFamily: FD, fontSize: 13, fontWeight: filter === key ? 500 : 400,
                transition: 'background 0.18s, color 0.18s',
              }}
            >
              {key === 'all' ? 'All' : key === 'week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '32px', display: 'flex', justifyContent: 'center', color: C.muted }}>
          <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : rows.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: C.muted, fontFamily: FD, fontSize: 13 }}>
          No transactions found
        </div>
      ) : (
        rows.map((tx, i) => {
          const isReceived = tx.type === 'received';
          const explorerUrl = tx.hash ? `https://explorer.solana.com/tx/${tx.hash}?cluster=devnet` : '#';

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 + i * 0.05, ease: EASE }}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 24px',
                borderBottom: i < rows.length - 1 ? `1px solid ${C.border2}` : 'none',
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: isReceived ? 'rgba(52,211,153,0.1)' : 'rgba(245,158,11,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16,
              }}>
                {isReceived ? '✅' : '📤'}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: FD, fontSize: 14, color: C.text, marginBottom: 3, fontWeight: 500 }}>
                  {tx.source}
                </p>
                <p style={{ fontFamily: FD, fontSize: 12, color: C.muted2 }}>{tx.date}</p>
              </div>

              <span style={{ fontFamily: FS, fontWeight: 700, fontSize: 15, flexShrink: 0, color: isReceived ? C.green : C.red }}>
                {isReceived ? '+' : '-'}{tx.amount} USDC
              </span>

              <a
                href={explorerUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontFamily: FD, fontSize: 12, color: C.muted2,
                  display: 'flex', alignItems: 'center', gap: 4,
                  transition: 'color 0.18s', flexShrink: 0,
                }}
                onMouseEnter={e => (e.currentTarget.style.color = C.primary)}
                onMouseLeave={e => (e.currentTarget.style.color = C.muted2)}
              >
                <ExternalLink size={13} /> View
              </a>
            </motion.div>
          );
        })
      )}
    </motion.div>
  );
}

// ─── Section 6: AI Assistant ───────────────────────────────────────────────────
interface ChatMsg { role: 'ai' | 'user'; text: string }

const QUICK_REPLIES = [
  { label: 'Mera balance?',      response: 'Aapka balance aapke wallet se fetch ho raha hai — upar dekho 💰' },
  { label: 'Last payment?',      response: 'Aakhri payment aaj 6:00 PM ko mila — 6 USDC Rajesh Contractors se ✅' },
  { label: 'Ghar paise bhejo',   response: 'Bilkul! "Send Money Home" section mein jaiye, amount aur family ka wallet address daalen, phir Send Now dabayein 📤' },
  { label: 'Is week kitna kama?', response: 'Is hafte ke transactions history mein dekh sakte ho — scroll down karo 💪' },
];

const INIT_MSGS: ChatMsg[] = [
  { role: 'ai', text: 'Namaste! Main aapki help karne ke liye hoon 🙏\n\nHindi ya English mein poochh sakte ho.' },
];

function AIAssistant() {
  const [open, setOpen]   = useState(false);
  const [msgs, setMsgs]   = useState<ChatMsg[]>(INIT_MSGS);
  const [input, setInput] = useState('');
  const bottomRef         = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  const send = (text: string) => {
    if (!text.trim()) return;
    setMsgs(m => [...m, { role: 'user', text: text.trim() }]);
    setInput('');
    setTimeout(() => {
      const match = QUICK_REPLIES.find(q =>
        text.toLowerCase().includes(q.label.toLowerCase().split(' ')[0])
      );
      const reply = match?.response ?? 'Mujhe samajh aa gaya. Main abhi iske baare mein information dhundh raha hoon 🔍';
      setMsgs(m => [...m, { role: 'ai', text: reply }]);
    }, 700);
  };

  const handleQuickReply = (qr: typeof QUICK_REPLIES[0]) => {
    setMsgs(m => [...m, { role: 'user', text: qr.label }]);
    setTimeout(() => setMsgs(m => [...m, { role: 'ai', text: qr.response }]), 600);
  };

  return (
    <>
      <motion.button
        onClick={() => setOpen(v => !v)}
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: 'fixed', bottom: 32, right: 32, zIndex: 110,
          width: 56, height: 56, borderRadius: '50%',
          background: open ? '#1A2030' : C.primary,
          border: open ? `1px solid ${C.border}` : 'none',
          cursor: 'pointer', color: open ? C.text : '#060B14',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: open ? 'none' : '0 8px 28px rgba(245,158,11,0.35)',
          transition: 'background 0.2s, box-shadow 0.2s, color 0.2s, border 0.2s',
        }}
        aria-label="AI Assistant"
      >
        {open ? <X size={20} /> : <MessageCircle size={22} />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.28, ease: EASE }}
            style={{
              position: 'fixed', right: 100, bottom: 24,
              width: 320, height: 480,
              background: '#0E1420', border: `1px solid ${C.border}`,
              borderRadius: 16,
              display: 'flex', flexDirection: 'column',
              zIndex: 109, overflow: 'hidden',
              boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{
              padding: '16px 18px', borderBottom: `1px solid ${C.border2}`,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(245,158,11,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <MessageCircle size={18} style={{ color: C.primary }} />
              </div>
              <div>
                <p style={{ fontFamily: FS, fontWeight: 700, fontSize: 14, color: C.text }}>KaamPay Assistant</p>
                <p style={{ fontFamily: FD, fontSize: 11, color: C.muted2 }}>Hindi or English · Online</p>
              </div>
            </div>

            <div style={{
              flex: 1, overflowY: 'auto', padding: '16px 16px 8px',
              display: 'flex', flexDirection: 'column', gap: 12,
            }}>
              {msgs.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '82%', padding: '9px 13px', borderRadius: 10,
                    background: msg.role === 'user' ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)',
                    border: msg.role === 'user' ? '1px solid rgba(245,158,11,0.25)' : `1px solid ${C.border2}`,
                    fontFamily: FD, fontSize: 13,
                    color: msg.role === 'user' ? C.primary : C.text,
                    lineHeight: 1.55, whiteSpace: 'pre-wrap',
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <div style={{ padding: '8px 12px', borderTop: `1px solid ${C.border2}`, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {QUICK_REPLIES.map(qr => (
                <button
                  key={qr.label}
                  onClick={() => handleQuickReply(qr)}
                  style={{
                    background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`,
                    color: C.muted, padding: '4px 10px', borderRadius: 100,
                    fontSize: 11, fontFamily: FD, cursor: 'pointer',
                    transition: 'background 0.15s, color 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.08)'; e.currentTarget.style.color = C.primary; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = C.muted; }}
                >
                  {qr.label}
                </button>
              ))}
            </div>

            <div style={{ padding: '10px 12px', borderTop: `1px solid ${C.border2}`, display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') send(input); }}
                placeholder="Ask me anything…"
                style={{
                  flex: 1, padding: '8px 12px',
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${C.border}`,
                  borderRadius: 8, color: C.text,
                  fontFamily: FD, fontSize: 13, outline: 'none',
                  transition: 'border-color 0.18s',
                }}
                onFocus={e => (e.target.style.borderColor = 'rgba(245,158,11,0.4)')}
                onBlur={e => (e.target.style.borderColor = C.border)}
              />
              <button
                onClick={() => send(input)}
                style={{
                  width: 34, height: 34, borderRadius: 8,
                  background: C.primary, border: 'none',
                  color: '#060B14', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'opacity 0.15s', flexShrink: 0,
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.84')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Page Root ─────────────────────────────────────────────────────────────────
export default function WorkerWallet() {
  const { connected, publicKey, connect } = useWalletConnection();
  const walletAddress = publicKey?.toBase58() ?? null;
  const { balance: usdcBalance, loading: usdcLoading } = useUSDCBalance(walletAddress);
  const { setVisible } = useWalletModal();
  const [activeTab, setActiveTab] = useState<WorkerTab>('wallet');

  const handleConnect = async () => {
    try {
      // Check Phantom is installed
      const phantom = (window as typeof window & { phantom?: { solana?: unknown } }).phantom?.solana;
      if (!phantom) {
        toast.error('Please install Phantom wallet from phantom.app', { duration: 5000 });
        window.open('https://phantom.app', '_blank');
        return;
      }
      await connect();
      toast.success('Wallet connected');
    } catch {
      setVisible(true);
    }
  };

  const qrAddress = walletAddress ?? '9qR1xKPmLNs4mK8sZvT2pQnYwJ7mL8s';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bgMain }}>
      <WorkerSidebar
        walletAddress={walletAddress}
        connected={connected}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main style={{ marginLeft: 240, flex: 1, padding: '28px 32px', minWidth: 0 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            {/* My Wallet tab (default) */}
            {activeTab === 'wallet' && (
              <>
                <WalletHeaderCard
                  balance={usdcBalance}
                  balanceLoading={usdcLoading}
                  walletAddress={walletAddress}
                  onConnect={handleConnect}
                  connected={connected}
                />
                <WeekSummary usdcBalance={usdcBalance} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <QRCard walletAddress={qrAddress} />
                  <SendToFamily connected={connected} usdcBalance={usdcBalance} />
                </div>
              </>
            )}

            {/* Payments tab */}
            {activeTab === 'payments' && (
              <div>
                <h2 style={{ fontFamily: FS, fontWeight: 700, fontSize: 22, color: C.text, marginBottom: 6 }}>My Payments</h2>
                <p style={{ fontFamily: FD, fontSize: 13, color: C.muted, marginBottom: 20 }}>Your wage payments and transfers</p>

                {/* Summary cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
                  {[
                    { label: 'This Month', val: '156 USDC' },
                    { label: 'This Week',  val: '36 USDC'  },
                    { label: 'Today',      val: '6 USDC'   },
                    { label: 'Total Ever', val: '2,340 USDC' },
                  ].map(c => (
                    <div key={c.label} style={{
                      background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px',
                    }}>
                      <p style={{ fontFamily: FD, fontSize: 11, color: C.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{c.label}</p>
                      <p style={{ fontFamily: FS, fontWeight: 700, fontSize: 17, color: C.text }}>{c.val}</p>
                    </div>
                  ))}
                </div>

                {/* Grouped payment list */}
                {[
                  {
                    date: 'TODAY',
                    items: [
                      { time: '6:00 PM', amount: 6, label: 'Rajesh Contractors', type: 'in', hash: '3xK9...mP2q' },
                    ],
                  },
                  {
                    date: 'YESTERDAY',
                    items: [
                      { time: '6:00 PM', amount: 6,  label: 'Rajesh Contractors', type: 'in',  hash: '7mN3...xP1q' },
                      { time: '11:00 AM', amount: 12, label: 'Sent to Family',     type: 'out', hash: '9qR1...mK8s' },
                    ],
                  },
                  {
                    date: 'APR 12',
                    items: [
                      { time: '6:00 PM', amount: 6, label: 'Rajesh Contractors', type: 'in', hash: '2kP7...nL4r' },
                    ],
                  },
                ].map(group => (
                  <div key={group.date} style={{ marginBottom: 20 }}>
                    <p style={{ fontFamily: FD, fontSize: 11, color: C.muted2, letterSpacing: '0.1em', marginBottom: 8 }}>{group.date}</p>
                    <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
                      {group.items.map((item, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: 14,
                          padding: '14px 18px',
                          borderBottom: i < group.items.length - 1 ? `1px solid ${C.border2}` : 'none',
                        }}>
                          <span style={{ fontSize: 18, flexShrink: 0 }}>{item.type === 'in' ? '✅' : '📤'}</span>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontFamily: FD, fontSize: 13, color: C.text, fontWeight: 500 }}>{item.label}</p>
                            <p style={{ fontFamily: FD, fontSize: 11, color: C.muted }}>{item.time}</p>
                          </div>
                          <span style={{
                            fontFamily: FS, fontWeight: 700, fontSize: 14,
                            color: item.type === 'in' ? C.green : C.red,
                          }}>
                            {item.type === 'in' ? '+' : '-'}{item.amount} USDC
                          </span>
                          <a
                            href={`https://explorer.solana.com/tx/${item.hash}?cluster=devnet`}
                            target="_blank" rel="noreferrer"
                            style={{
                              fontFamily: FD, fontSize: 12, color: C.primary,
                              padding: '4px 10px', borderRadius: 6,
                              border: `1px solid rgba(245,158,11,0.2)`,
                              background: 'rgba(245,158,11,0.06)',
                              transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.14)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.06)')}
                          >
                            View
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Send Money tab */}
            {activeTab === 'send' && (
              <div>
                <h2 style={{ fontFamily: FS, fontWeight: 700, fontSize: 22, color: C.text, marginBottom: 6 }}>Send Money</h2>
                <p style={{ fontFamily: FD, fontSize: 13, color: C.muted, marginBottom: 24 }}>Transfer USDC to family or friends</p>
                <SendToFamily connected={connected} usdcBalance={usdcBalance} />
              </div>
            )}

            {/* History tab */}
            {activeTab === 'history' && (
              <div>
                <h2 style={{ fontFamily: FS, fontWeight: 700, fontSize: 22, color: C.text, marginBottom: 6 }}>Transaction History</h2>
                <p style={{ fontFamily: FD, fontSize: 13, color: C.muted, marginBottom: 24 }}>All your payments and transfers</p>
                <PaymentHistory walletAddress={walletAddress} />
              </div>
            )}

            {/* Help tab */}
            {activeTab === 'help' && (
              <div style={{ maxWidth: 560 }}>
                <h2 style={{ fontFamily: FS, fontWeight: 700, fontSize: 22, color: C.text, marginBottom: 6 }}>Help & Support</h2>
                <p style={{ fontFamily: FD, fontSize: 13, color: C.muted, marginBottom: 24 }}>Common questions about KaamPay</p>

                {[
                  { q: 'Mera paisa kab aayega?',         a: 'Aapka contractor har roz payment karta hai. Aaj 6 PM tak aa jayega.' },
                  { q: 'USDC kya hai?',                   a: 'USDC ek digital dollar hai. 1 USDC = 1 USD = ₹83. Price fluctuate nahi karta.' },
                  { q: 'Paise ghar kaise bhejun?',        a: 'Send Money tab mein jao, amount aur family ka wallet address dalein.' },
                  { q: 'Agar payment na aaye toh?',       a: 'Apne contractor se baat karein ya KaamPay support se contact karein.' },
                  { q: 'Wallet kaise connect karein?',    a: 'Phantom app download karein phantom.app se, phir Connect Wallet button dabao.' },
                ].map(({ q, a }) => (
                  <div key={q} style={{
                    background: C.cardBg, border: `1px solid ${C.border}`,
                    borderRadius: 12, padding: '18px 20px', marginBottom: 10,
                  }}>
                    <p style={{ fontFamily: FD, fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 6 }}>🙋 {q}</p>
                    <p style={{ fontFamily: FD, fontSize: 13, color: C.muted, lineHeight: 1.65 }}>{a}</p>
                  </div>
                ))}

                {/* Contact */}
                <div style={{
                  marginTop: 24, background: 'rgba(245,158,11,0.06)',
                  border: `1px solid rgba(245,158,11,0.2)`, borderRadius: 12, padding: '20px 22px',
                }}>
                  <p style={{ fontFamily: FS, fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 14 }}>Contact Support</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <a href="mailto:support@kaampay.in" style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      fontFamily: FD, fontSize: 13, color: C.primary, textDecoration: 'none',
                    }}>
                      📧 support@kaampay.in
                    </a>
                    <span style={{ fontFamily: FD, fontSize: 13, color: C.primary }}>
                      📱 Telegram: @KaamPaySupport
                    </span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div style={{ height: 96 }} />
      </main>

      <AIAssistant />
    </div>
  );
}
