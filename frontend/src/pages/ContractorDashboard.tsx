import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Users, CreditCard, FileText, BarChart2, Settings,
  Plus, Zap, Clock, CheckCircle, TrendingUp, ExternalLink, X,
  Receipt, Loader2, LogOut,
} from 'lucide-react';
import {
  getWorkers, addWorker, payWorker, payAllWorkers, getDashboardStats,
} from '../utils/api';
import type { Worker, DashboardStats } from '../types';

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:       '#060B14',
  bgMain:   '#080D18',
  primary:  '#F59E0B',
  text:     '#F0EDE8',
  muted:    'rgba(240,237,232,0.5)',
  muted2:   'rgba(240,237,232,0.28)',
  cardBg:   'rgba(255,255,255,0.03)',
  border:   'rgba(255,255,255,0.08)',
  border2:  'rgba(255,255,255,0.05)',
  green:    '#34D399',
  purple:   '#A78BFA',
} as const;

const FONT_SYNE = 'Syne, sans-serif';
const FONT_DM   = 'DM Sans, sans-serif';

// Worker avatar color palette
const WORKER_COLORS = ['#7C3AED','#0891B2','#DB2777','#D97706','#0D9488','#DC2626','#7C3AED','#059669'];
const workerColor = (i: number) => WORKER_COLORS[i % WORKER_COLORS.length];

type Tab = 'dashboard' | 'workers' | 'payments' | 'settings';

const NAV_ITEMS: { label: string; icon: React.ReactNode; tab?: Tab; path?: string }[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={16} />, tab: 'dashboard' },
  { label: 'Workers',   icon: <Users size={16} />,           tab: 'workers'   },
  { label: 'Payments',  icon: <CreditCard size={16} />,      tab: 'payments'  },
  { label: 'Invoices',  icon: <FileText size={16} />,        path: '/invoice'   },
  { label: 'Analytics', icon: <BarChart2 size={16} />,       path: '/analytics' },
  { label: 'Settings',  icon: <Settings size={16} />,        tab: 'settings'  },
];

const initials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

const today = new Date().toLocaleDateString('en-IN', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
});

// ─── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ activeTab, setActiveTab }: { activeTab: Tab; setActiveTab: (t: Tab) => void }) {
  const navigate = useNavigate();
  const user = (() => { try { return JSON.parse(localStorage.getItem('kp_user') ?? '{}'); } catch { return {}; } })();

  const handleLogout = () => {
    localStorage.removeItem('kp_user');
    toast.success('Logged out');
    navigate('/login?type=contractor');
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
          <span style={{ fontFamily: FONT_SYNE, fontWeight: 800, fontSize: 18, color: C.text, letterSpacing: '-0.3px' }}>
            KaamPay
          </span>
          <span className="pulse-dot" />
        </Link>
        {user?.company && (
          <p style={{ fontFamily: FONT_DM, fontSize: 11, color: C.muted, marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.company}
          </p>
        )}
      </div>

      <nav style={{ padding: '16px 8px', flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map(item => {
          const isActive = item.tab ? activeTab === item.tab : false;
          return (
            <button
              key={item.label}
              onClick={() => {
                if (item.tab) setActiveTab(item.tab);
                else if (item.path) navigate(item.path);
              }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                borderLeft: isActive ? `3px solid ${C.primary}` : '3px solid transparent',
                background: isActive ? 'rgba(245,158,11,0.1)' : 'transparent',
                color:      isActive ? C.primary : C.muted,
                fontFamily: FONT_DM, fontSize: 14,
                fontWeight: isActive ? 500 : 400,
                textAlign: 'left',
                transition: 'background 0.18s, color 0.18s, border-color 0.18s',
              }}
              onMouseEnter={e => {
                if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = C.text; }
              }}
              onMouseLeave={e => {
                if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.muted; }
              }}
            >
              <span style={{ display: 'flex', flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: '12px', borderTop: `1px solid ${C.border2}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* User info */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', borderRadius: 8,
          background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'rgba(245,158,11,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: FONT_SYNE, fontWeight: 700, fontSize: 11, color: C.primary, flexShrink: 0,
          }}>
            {(user?.name ?? 'C').slice(0, 2).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontFamily: FONT_DM, fontSize: 12, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name ?? 'Contractor'}
            </p>
            <p style={{ fontFamily: FONT_DM, fontSize: 10, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email ?? ''}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'transparent', color: C.muted,
            fontFamily: FONT_DM, fontSize: 13, textAlign: 'left',
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

// ─── Top Bar ───────────────────────────────────────────────────────────────────
function TopBar({
  onAddWorker,
  onPayAll,
  payingAll,
}: {
  onAddWorker: () => void;
  onPayAll: () => void;
  payingAll: boolean;
}) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      marginBottom: 28,
    }}>
      <div>
        <h1 style={{
          fontFamily: FONT_SYNE, fontWeight: 700,
          fontSize: 26, color: C.text, letterSpacing: '-0.5px', marginBottom: 4,
        }}>
          Dashboard
        </h1>
        <p style={{ color: C.muted, fontSize: 13, fontFamily: FONT_DM }}>{today}</p>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
        <button
          onClick={onAddWorker}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'transparent', border: `1px solid ${C.border}`,
            color: C.text, padding: '8px 16px', borderRadius: 8,
            fontSize: 13, fontWeight: 500, fontFamily: FONT_DM, cursor: 'pointer',
            transition: 'border-color 0.18s, background 0.18s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = C.border; }}
        >
          <Plus size={15} /> Add Worker
        </button>

        <button
          onClick={onPayAll}
          disabled={payingAll}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: payingAll ? 'rgba(52,211,153,0.5)' : C.green,
            color: '#060B14', padding: '8px 16px', borderRadius: 8,
            fontSize: 13, fontWeight: 600, fontFamily: FONT_DM,
            cursor: payingAll ? 'default' : 'pointer',
            border: 'none',
            transition: 'opacity 0.18s, transform 0.18s',
          }}
          onMouseEnter={e => { if (!payingAll) { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)'; }}}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          {payingAll ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={15} />}
          {payingAll ? 'Sending…' : 'Pay All Workers'}
        </button>
      </div>
    </div>
  );
}

// ─── Stats Cards ───────────────────────────────────────────────────────────────
interface StatDef {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

function buildStats(stats: DashboardStats | null): StatDef[] {
  return [
    {
      label: 'Total Workers',
      value: stats ? String(stats.totalWorkers) : '—',
      sub: 'enrolled on KaamPay',
      icon: <Users size={16} />,
      iconBg: 'rgba(167,139,250,0.14)', iconColor: '#A78BFA',
    },
    {
      label: 'Paid Today',
      value: stats ? `${stats.paidToday.toFixed(1)} USDC` : '—',
      sub: 'completed payments',
      icon: <CheckCircle size={16} />,
      iconBg: 'rgba(52,211,153,0.13)', iconColor: '#34D399',
    },
    {
      label: 'Pending Today',
      value: stats ? `${stats.pendingToday.toFixed(1)} USDC` : '—',
      sub: 'awaiting settlement',
      icon: <Clock size={16} />,
      iconBg: 'rgba(245,158,11,0.13)', iconColor: '#F59E0B',
    },
    {
      label: 'This Month',
      value: stats ? `${stats.thisMonth.toFixed(0)} USDC` : '—',
      sub: 'total disbursed',
      icon: <TrendingUp size={16} />,
      iconBg: 'rgba(8,145,178,0.13)', iconColor: '#38BDF8',
    },
  ];
}

function StatCard({ s, delay }: { s: StatDef; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: C.cardBg, border: `1px solid ${C.border}`,
        borderRadius: 12, padding: '20px 22px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <p style={{ color: C.muted, fontSize: 12, fontFamily: FONT_DM, letterSpacing: '0.02em' }}>{s.label}</p>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: s.iconBg, color: s.iconColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {s.icon}
        </div>
      </div>
      <p style={{ fontFamily: FONT_SYNE, fontWeight: 700, fontSize: 22, color: C.text, letterSpacing: '-0.5px', marginBottom: 6 }}>
        {s.value}
      </p>
      <p style={{ color: C.muted2, fontSize: 12, fontFamily: FONT_DM }}>{s.sub}</p>
    </motion.div>
  );
}

function StatsCards({ stats }: { stats: DashboardStats | null }) {
  const defs = buildStats(stats);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
      {defs.map((s, i) => <StatCard key={s.label} s={s} delay={i * 0.08} />)}
    </div>
  );
}

// ─── Quick Pay ─────────────────────────────────────────────────────────────────
function QuickPay({
  workers,
  onPayAll,
  paying,
}: {
  workers: Worker[];
  onPayAll: () => void;
  paying: boolean;
}) {
  const pending = workers.filter(w => w.status === 'pending' || !w.status);
  const total = workers.reduce((s, w) => s + w.dailyWage, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.38, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: C.cardBg, border: `1px solid ${C.border}`,
        borderRadius: 12, padding: '22px', marginBottom: 16,
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontFamily: FONT_SYNE, fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 4 }}>
          Pay All Workers Today
        </h3>
        <p style={{ color: C.muted, fontSize: 13, fontFamily: FONT_DM }}>
          {workers.length} workers · {total} USDC total
        </p>
      </div>

      <button
        onClick={onPayAll}
        disabled={paying}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: paying ? 'rgba(245,158,11,0.5)' : C.primary,
          color: '#060B14', padding: '11px', borderRadius: 8,
          fontSize: 14, fontWeight: 600, fontFamily: FONT_DM,
          cursor: paying ? 'default' : 'pointer',
          border: 'none', marginBottom: 10,
          transition: 'background 0.2s, transform 0.18s',
        }}
        onMouseEnter={e => { if (!paying) e.currentTarget.style.transform = 'translateY(-1px)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        {paying
          ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Sending to Solana…</>
          : <><Zap size={15} /> Pay All Now</>
        }
      </button>

      <p style={{ color: C.muted2, fontSize: 12, fontFamily: FONT_DM, textAlign: 'center' }}>
        {pending.length} workers pending payment
      </p>
    </motion.div>
  );
}

// ─── Workers Table ─────────────────────────────────────────────────────────────
const COL_GRID = '1.8fr 88px 80px 130px 88px 110px';

function WorkerRow({
  w,
  index,
  onPay,
}: {
  w: Worker;
  index: number;
  onPay: (w: Worker) => Promise<void>;
}) {
  const [hovered, setHovered] = useState(false);
  const [paying, setPaying] = useState(false);
  const isPaid = w.status === 'paid';
  const color = workerColor(index);

  const handlePay = async () => {
    setPaying(true);
    try {
      await onPay(w);
    } finally {
      setPaying(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: 0.3 + index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid', gridTemplateColumns: COL_GRID,
        alignItems: 'center', padding: '13px 20px',
        background: hovered ? 'rgba(255,255,255,0.025)' : 'transparent',
        borderBottom: `1px solid ${C.border2}`,
        transition: 'background 0.15s',
      }}
    >
      {/* Name + avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: color, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: FONT_SYNE, fontWeight: 700, fontSize: 12, color: '#fff',
        }}>
          {initials(w.name)}
        </div>
        <div>
          <span style={{ fontFamily: FONT_DM, fontSize: 14, color: C.text, display: 'block' }}>{w.name}</span>
          {w.role && <span style={{ fontFamily: FONT_DM, fontSize: 11, color: C.muted2 }}>{w.role}</span>}
        </div>
      </div>

      {/* Wage */}
      <span style={{ fontFamily: FONT_SYNE, fontWeight: 600, fontSize: 14, color: C.text }}>
        {w.dailyWage} USDC
      </span>

      {/* Active badge */}
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        background: 'rgba(52,211,153,0.1)', color: C.green,
        padding: '3px 10px', borderRadius: 100,
        fontSize: 11, fontFamily: FONT_DM, fontWeight: 500, width: 'fit-content',
      }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.green, flexShrink: 0 }} />
        Active
      </span>

      {/* Wallet */}
      <span style={{ fontFamily: 'ui-monospace, Consolas, monospace', fontSize: 12, color: C.muted }}>
        {w.wallet.length > 12 ? `${w.wallet.slice(0, 5)}...${w.wallet.slice(-4)}` : w.wallet}
      </span>

      {/* Today status */}
      <span style={{
        display: 'inline-flex', alignItems: 'center',
        background: isPaid ? 'rgba(52,211,153,0.1)' : 'rgba(245,158,11,0.1)',
        color:      isPaid ? C.green : C.primary,
        padding: '3px 10px', borderRadius: 100,
        fontSize: 11, fontFamily: FONT_DM, fontWeight: 500, width: 'fit-content',
      }}>
        {isPaid ? 'Paid' : 'Pending'}
      </span>

      {/* Action */}
      {isPaid ? (
        <button style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'transparent', border: `1px solid ${C.border}`,
          color: C.muted, padding: '5px 11px', borderRadius: 6,
          fontSize: 12, fontFamily: FONT_DM, cursor: 'pointer',
          transition: 'border-color 0.15s, color 0.15s', width: 'fit-content',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; e.currentTarget.style.color = C.text; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
        >
          <Receipt size={12} /> Receipt
        </button>
      ) : (
        <button
          onClick={handlePay}
          disabled={paying}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: paying ? 'rgba(245,158,11,0.5)' : C.primary,
            border: 'none', color: '#060B14',
            padding: '5px 11px', borderRadius: 6,
            fontSize: 12, fontWeight: 600, fontFamily: FONT_DM,
            cursor: paying ? 'default' : 'pointer',
            transition: 'opacity 0.15s', width: 'fit-content',
          }}
          onMouseEnter={e => { if (!paying) e.currentTarget.style.opacity = '0.82'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
        >
          {paying
            ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
            : <Zap size={12} />
          }
          {paying ? '…' : 'Pay Now'}
        </button>
      )}
    </motion.div>
  );
}

function WorkersTable({
  workers,
  loading,
  onAddWorker,
  onPayWorker,
}: {
  workers: Worker[];
  loading: boolean;
  onAddWorker: () => void;
  onPayWorker: (w: Worker) => Promise<void>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.26, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: C.cardBg, border: `1px solid ${C.border}`,
        borderRadius: 12, overflow: 'hidden',
      }}
    >
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '18px 20px', borderBottom: `1px solid ${C.border}`,
      }}>
        <div>
          <h3 style={{ fontFamily: FONT_SYNE, fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 2 }}>
            Workers
          </h3>
          <p style={{ fontFamily: FONT_DM, fontSize: 12, color: C.muted }}>
            {loading ? 'Loading…' : `${workers.length} workers enrolled`}
          </p>
        </div>
        <button
          onClick={onAddWorker}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
            color: C.primary, padding: '6px 14px', borderRadius: 7,
            fontSize: 12, fontFamily: FONT_DM, cursor: 'pointer',
            transition: 'background 0.18s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.14)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.08)')}
        >
          <Plus size={13} /> Add Worker
        </button>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: COL_GRID,
        padding: '10px 20px', borderBottom: `1px solid ${C.border2}`,
      }}>
        {['Name', 'Daily Wage', 'Status', 'Wallet', 'Today', 'Action'].map(col => (
          <span key={col} style={{ fontSize: 11, color: C.muted2, fontFamily: FONT_DM, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {col}
          </span>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '32px', display: 'flex', justifyContent: 'center', color: C.muted }}>
          <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : workers.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: C.muted, fontFamily: FONT_DM, fontSize: 13 }}>
          No workers yet. Add your first worker.
        </div>
      ) : (
        workers.map((w, i) => (
          <WorkerRow key={w.id} w={w} index={i} onPay={onPayWorker} />
        ))
      )}
    </motion.div>
  );
}

// ─── Recent Transactions ───────────────────────────────────────────────────────
function RecentTransactions({ stats }: { stats: DashboardStats | null }) {
  const txns = stats?.recentPayments ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.44, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: C.cardBg, border: `1px solid ${C.border}`,
        borderRadius: 12, overflow: 'hidden',
      }}
    >
      <div style={{ padding: '18px 20px', borderBottom: `1px solid ${C.border}` }}>
        <h3 style={{ fontFamily: FONT_SYNE, fontWeight: 700, fontSize: 15, color: C.text }}>
          Recent Payments
        </h3>
      </div>

      {txns.length === 0 ? (
        <div style={{ padding: '24px 20px', textAlign: 'center', color: C.muted, fontFamily: FONT_DM, fontSize: 13 }}>
          No payments yet
        </div>
      ) : (
        <div>
          {txns.slice(0, 5).map((tx, i) => {
            const name = tx.worker?.name ?? 'Worker';
            const hash = tx.txHash ?? tx.dodoId ?? '—';
            const color = workerColor(i);
            const explorerUrl = `https://explorer.solana.com/tx/${hash}?cluster=devnet`;

            return (
              <div
                key={tx.id}
                style={{
                  padding: '14px 20px',
                  borderBottom: i < Math.min(txns.length, 5) - 1 ? `1px solid ${C.border2}` : 'none',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: color, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: FONT_SYNE, fontWeight: 700, fontSize: 11, color: '#fff',
                }}>
                  {initials(name)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                    <span style={{ fontFamily: FONT_DM, fontSize: 13, color: C.text, fontWeight: 500 }}>{name}</span>
                    <span style={{ fontFamily: FONT_SYNE, fontWeight: 700, fontSize: 13, color: C.green, flexShrink: 0 }}>
                      +{tx.amount} USDC
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: C.muted2 }}>
                      {hash.length > 12 ? `${hash.slice(0, 6)}…${hash.slice(-4)}` : hash}
                    </span>
                    <span style={{ fontSize: 11, color: C.muted2, fontFamily: FONT_DM }}>
                      {new Date(tx.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <a
                  href={tx.txHash ? explorerUrl : '#'}
                  target="_blank"
                  rel="noreferrer"
                  title="View on Solana Explorer"
                  style={{ color: C.muted2, transition: 'color 0.15s', flexShrink: 0, display: 'flex' }}
                  onMouseEnter={e => ((e.currentTarget).style.color = C.primary)}
                  onMouseLeave={e => ((e.currentTarget).style.color = C.muted2)}
                >
                  <ExternalLink size={13} />
                </a>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// ─── Add Worker Modal ──────────────────────────────────────────────────────────
const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  background: 'rgba(255,255,255,0.04)',
  border: `1px solid ${C.border}`,
  borderRadius: 8, color: C.text,
  fontFamily: FONT_DM, fontSize: 14,
  outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.18s',
};

const LABEL_STYLE: React.CSSProperties = {
  display: 'block', fontFamily: FONT_DM,
  fontSize: 12, color: C.muted, marginBottom: 7, letterSpacing: '0.02em',
};

function AddWorkerModal({
  isOpen,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({ name: '', wage: '', wallet: '', role: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [isOpen, onClose]);

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.wallet.trim() || !form.wage) {
      toast.error('Please fill in name, wallet, and daily wage.');
      return;
    }
    setSaving(true);
    try {
      await addWorker({
        name: form.name.trim(),
        wallet: form.wallet.trim(),
        dailyWage: parseFloat(form.wage),
        role: form.role.trim() || undefined,
        contractorId: 'default-contractor',
      });
      toast.success('Worker added successfully');
      setForm({ name: '', wage: '', wallet: '', role: '' });
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to add worker');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(0,0,0,0.72)',
              backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
            }}
          />

          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 201, width: '100%', maxWidth: 460,
              background: '#0E1420', border: `1px solid ${C.border}`,
              borderRadius: 16, padding: 28,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h2 style={{ fontFamily: FONT_SYNE, fontWeight: 700, fontSize: 18, color: C.text, marginBottom: 2 }}>
                  Add Worker
                </h2>
                <p style={{ fontFamily: FONT_DM, fontSize: 13, color: C.muted }}>
                  Worker will receive daily USDC payments
                </p>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'rgba(255,255,255,0.06)', border: 'none',
                  borderRadius: 8, padding: 8, cursor: 'pointer', color: C.muted,
                  display: 'flex', transition: 'background 0.18s, color 0.18s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = C.text; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = C.muted; }}
              >
                <X size={17} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={LABEL_STYLE}>Full Name</label>
                <input value={form.name} onChange={set('name')} placeholder="e.g. Suresh Kumar" style={INPUT_STYLE}
                  onFocus={e => (e.target.style.borderColor = 'rgba(245,158,11,0.5)')}
                  onBlur={e => (e.target.style.borderColor = C.border)} />
              </div>
              <div>
                <label style={LABEL_STYLE}>Daily Wage (USDC)</label>
                <input value={form.wage} onChange={set('wage')} placeholder="e.g. 6" type="number" min="1" style={INPUT_STYLE}
                  onFocus={e => (e.target.style.borderColor = 'rgba(245,158,11,0.5)')}
                  onBlur={e => (e.target.style.borderColor = C.border)} />
              </div>
              <div>
                <label style={LABEL_STYLE}>Wallet Address (Solana)</label>
                <input value={form.wallet} onChange={set('wallet')} placeholder="e.g. 8xK2mN9p..."
                  style={{ ...INPUT_STYLE, fontFamily: 'ui-monospace, Consolas, monospace', fontSize: 13 }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(245,158,11,0.5)')}
                  onBlur={e => (e.target.style.borderColor = C.border)} />
              </div>
              <div>
                <label style={LABEL_STYLE}>Skill / Role</label>
                <input value={form.role} onChange={set('role')} placeholder="e.g. Mason, Electrician, Driver" style={INPUT_STYLE}
                  onFocus={e => (e.target.style.borderColor = 'rgba(245,158,11,0.5)')}
                  onBlur={e => (e.target.style.borderColor = C.border)} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1, padding: '11px',
                  background: 'transparent', border: `1px solid ${C.border}`,
                  color: C.muted, borderRadius: 8,
                  fontSize: 14, fontFamily: FONT_DM, cursor: 'pointer',
                  transition: 'border-color 0.18s, color 0.18s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; e.currentTarget.style.color = C.text; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  flex: 1, padding: '11px',
                  background: saving ? 'rgba(245,158,11,0.5)' : C.primary,
                  border: 'none', color: '#060B14', borderRadius: 8,
                  fontSize: 14, fontWeight: 600, fontFamily: FONT_DM,
                  cursor: saving ? 'default' : 'pointer',
                  transition: 'opacity 0.18s',
                }}
                onMouseEnter={e => { if (!saving) e.currentTarget.style.opacity = '0.86'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
              >
                {saving ? 'Saving…' : 'Save Worker'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Payments Tab ─────────────────────────────────────────────────────────────
const PAYMENT_ROWS = [
  { name: 'Suresh Kumar',  amount: 6, date: 'Apr 14', hash: '3xK9...mP2q' },
  { name: 'Ramesh Singh',  amount: 7, date: 'Apr 14', hash: '7mN3...xP1q' },
  { name: 'Priya Devi',    amount: 5, date: 'Apr 14', hash: '9qR1...mK8s' },
  { name: 'Amit Sharma',   amount: 6, date: 'Apr 13', hash: '2kP7...nL4r' },
  { name: 'Sunita Rao',    amount: 5, date: 'Apr 13', hash: '4rS2...pJ7t' },
  { name: 'Vikram Patel',  amount: 8, date: 'Apr 13', hash: '6tU3...qK9m' },
  { name: 'Suresh Kumar',  amount: 6, date: 'Apr 12', hash: '8vW4...rL1n' },
  { name: 'Ramesh Singh',  amount: 7, date: 'Apr 12', hash: '1wX5...sM2o' },
  { name: 'Priya Devi',    amount: 5, date: 'Apr 12', hash: '5yZ6...tN3p' },
  { name: 'Amit Sharma',   amount: 6, date: 'Apr 11', hash: '9aB7...uO4q' },
];
const ROW_COLORS = ['#7C3AED','#0891B2','#DB2777','#D97706','#0D9488','#DC2626'];
const rowColor = (i: number) => ROW_COLORS[i % ROW_COLORS.length];

function PaymentsTab() {
  const [filter, setFilter] = useState<'all'|'today'|'week'|'month'>('all');
  const totalShown = PAYMENT_ROWS.reduce((s, r) => s + r.amount, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: FONT_SYNE, fontWeight: 700, fontSize: 24, color: C.text, marginBottom: 4 }}>Payment History</h1>
          <p style={{ fontFamily: FONT_DM, fontSize: 13, color: C.muted }}>All USDC wages paid to your workers</p>
        </div>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 16px', borderRadius: 8,
          background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`,
          color: C.muted, fontFamily: FONT_DM, fontSize: 13, cursor: 'pointer',
          transition: 'background 0.18s, color 0.18s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = C.text; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = C.muted; }}
          onClick={() => { toast.success('CSV exported!'); }}
        >
          ↓ Export CSV
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Paid',      val: '4,320 USDC' },
          { label: 'Transactions',    val: '48' },
          { label: 'Workers Paid',    val: '12' },
          { label: 'Avg per Worker',  val: '360 USDC' },
        ].map(c => (
          <div key={c.label} style={{
            background: C.cardBg, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: '16px 18px',
          }}>
            <p style={{ fontFamily: FONT_DM, fontSize: 11, color: C.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{c.label}</p>
            <p style={{ fontFamily: FONT_SYNE, fontWeight: 700, fontSize: 20, color: C.text }}>{c.val}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {(['all','today','week','month'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 14px', borderRadius: 100, border: 'none', cursor: 'pointer',
            background: filter === f ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
            color:      filter === f ? C.primary : C.muted,
            fontFamily: FONT_DM, fontSize: 12, fontWeight: filter === f ? 600 : 400,
            transition: 'all 0.18s',
          }}>
            {f === 'all' ? 'All' : f === 'today' ? 'Today' : f === 'week' ? 'This Week' : 'This Month'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        {/* Header row */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1.5fr',
          padding: '10px 20px', borderBottom: `1px solid ${C.border2}`,
        }}>
          {['Worker', 'Amount', 'Date', 'Time', 'Status', 'TX Hash'].map(col => (
            <span key={col} style={{ fontFamily: FONT_DM, fontSize: 11, color: C.muted2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{col}</span>
          ))}
        </div>

        {/* Data rows */}
        {PAYMENT_ROWS.map((row, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1.5fr',
            padding: '13px 20px', alignItems: 'center',
            borderBottom: i < PAYMENT_ROWS.length - 1 ? `1px solid ${C.border2}` : 'none',
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {/* Worker */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                background: rowColor(i),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: FONT_SYNE, fontWeight: 700, fontSize: 11, color: '#fff',
              }}>
                {row.name.split(' ').map(n => n[0]).join('').slice(0,2)}
              </div>
              <span style={{ fontFamily: FONT_DM, fontSize: 13, color: C.text }}>{row.name}</span>
            </div>
            {/* Amount */}
            <span style={{ fontFamily: FONT_SYNE, fontWeight: 700, fontSize: 13, color: C.green }}>+{row.amount} USDC</span>
            {/* Date */}
            <span style={{ fontFamily: FONT_DM, fontSize: 13, color: C.muted }}>{row.date}</span>
            {/* Time */}
            <span style={{ fontFamily: FONT_DM, fontSize: 13, color: C.muted }}>6:00 PM</span>
            {/* Status */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: 'rgba(52,211,153,0.1)', color: C.green,
              padding: '3px 9px', borderRadius: 100, fontSize: 11, fontFamily: FONT_DM, width: 'fit-content',
            }}>✓ Success</span>
            {/* TX Hash + actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 11, color: C.muted2 }}>{row.hash}</span>
              <a
                href={`https://explorer.solana.com/tx/${row.hash.replace('...','xxx')}?cluster=devnet`}
                target="_blank" rel="noreferrer"
                title="View on Solana Explorer"
                style={{ color: C.muted2, display: 'flex', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = C.primary)}
                onMouseLeave={e => (e.currentTarget.style.color = C.muted2)}
              >
                <ExternalLink size={12} />
              </a>
              <button
                title="Download receipt"
                onClick={() => toast.success('Receipt downloaded')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted2, display: 'flex', padding: 0, transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = C.text)}
                onMouseLeave={e => (e.currentTarget.style.color = C.muted2)}
              >
                <CheckCircle size={12} />
              </button>
            </div>
          </div>
        ))}

        {/* Footer total */}
        <div style={{
          padding: '12px 20px', borderTop: `1px solid ${C.border}`,
          display: 'flex', justifyContent: 'flex-end',
          fontFamily: FONT_DM, fontSize: 13, color: C.muted,
        }}>
          Total: <span style={{ color: C.green, fontWeight: 600, marginLeft: 6 }}>{totalShown} USDC</span>&nbsp;shown
        </div>
      </div>
    </motion.div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────
function SettingsTab() {
  const navigate = useNavigate();
  const raw = localStorage.getItem('kp_user');
  const user = raw ? JSON.parse(raw) : {};
  const [f, setF] = useState({ name: user.name ?? '', email: user.email ?? '', company: user.company ?? '', wallet: user.wallet ?? '', password: '', confirm: '' });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF(p => ({ ...p, [k]: e.target.value }));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (f.password && f.password !== f.confirm) { toast.error('Passwords do not match'); return; }
    const updated = { ...user, name: f.name, email: f.email, company: f.company, wallet: f.wallet };
    localStorage.setItem('kp_user', JSON.stringify(updated));
    toast.success('Settings saved');
  };

  const handleLogout = () => {
    localStorage.removeItem('kp_user');
    toast.success('Logged out');
    navigate('/login?type=contractor');
  };

  const IS: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`,
    borderRadius: 8, color: C.text, fontFamily: FONT_DM, fontSize: 14,
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.18s',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <h1 style={{ fontFamily: FONT_SYNE, fontWeight: 700, fontSize: 24, color: C.text, marginBottom: 6 }}>Settings</h1>
      <p style={{ fontFamily: FONT_DM, fontSize: 13, color: C.muted, marginBottom: 28 }}>Manage your profile and account</p>

      <form onSubmit={handleSave} style={{
        background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 28, maxWidth: 520,
      }}>
        <h3 style={{ fontFamily: FONT_SYNE, fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 20 }}>Profile</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { label: 'Company Name', key: 'company' as const, placeholder: 'Sharma Construction' },
            { label: 'Full Name',    key: 'name'    as const, placeholder: 'Your name' },
            { label: 'Email',        key: 'email'   as const, placeholder: 'you@company.com' },
            { label: 'Wallet Address', key: 'wallet' as const, placeholder: 'Solana wallet address' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label style={{ display: 'block', fontFamily: FONT_DM, fontSize: 12, color: C.muted, marginBottom: 6 }}>{label}</label>
              <input value={f[key]} onChange={set(key)} placeholder={placeholder} style={IS}
                onFocus={e => (e.target.style.borderColor = 'rgba(245,158,11,0.5)')}
                onBlur={e => (e.target.style.borderColor = C.border)} />
            </div>
          ))}

          <div style={{ borderTop: `1px solid ${C.border2}`, paddingTop: 16, marginTop: 4 }}>
            <p style={{ fontFamily: FONT_DM, fontSize: 12, color: C.muted, marginBottom: 12 }}>Change Password (leave blank to keep current)</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input type="password" value={f.password} onChange={set('password')} placeholder="New password" style={IS}
                onFocus={e => (e.target.style.borderColor = 'rgba(245,158,11,0.5)')} onBlur={e => (e.target.style.borderColor = C.border)} />
              <input type="password" value={f.confirm} onChange={set('confirm')} placeholder="Confirm new password" style={IS}
                onFocus={e => (e.target.style.borderColor = 'rgba(245,158,11,0.5)')} onBlur={e => (e.target.style.borderColor = C.border)} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button type="submit" style={{
            flex: 1, padding: '11px', background: C.primary, border: 'none',
            color: '#060B14', borderRadius: 8, fontSize: 14, fontWeight: 600, fontFamily: FONT_DM, cursor: 'pointer',
          }}>
            Save Changes
          </button>
          <button type="button" onClick={handleLogout} style={{
            padding: '11px 18px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)',
            color: '#F87171', borderRadius: 8, fontSize: 14, fontFamily: FONT_DM, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </form>
    </motion.div>
  );
}

// ─── Dashboard Root ────────────────────────────────────────────────────────────
export default function ContractorDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [modalOpen, setModalOpen] = useState(false);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  const [payingAll, setPayingAll] = useState(false);

  const CONTRACTOR_ID = 'default-contractor';

  const fetchWorkers = useCallback(async () => {
    setLoadingWorkers(true);
    try {
      const data = await getWorkers(CONTRACTOR_ID);
      setWorkers(data);
    } catch {
      // Backend not connected — silent fallback (mock returned by server)
    } finally {
      setLoadingWorkers(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const data = await getDashboardStats({ contractorId: CONTRACTOR_ID });
      setStats(data);
    } catch {
      // Stats unavailable — keep null
    }
  }, []);

  useEffect(() => {
    fetchWorkers();
    fetchStats();
  }, [fetchWorkers, fetchStats]);

  const handlePayWorker = async (w: Worker) => {
    try {
      await payWorker(w.id, w.dailyWage);
      toast.success(`Paid ${w.name} ${w.dailyWage} USDC`);
      setWorkers(prev => prev.map(x => x.id === w.id ? { ...x, status: 'paid' } : x));
      fetchStats();
    } catch (err: any) {
      toast.error(err?.message ?? 'Payment failed. Try again.');
    }
  };

  const handlePayAll = async () => {
    setPayingAll(true);
    try {
      const result = await payAllWorkers(CONTRACTOR_ID);
      toast.success(`Paid ${result.paid} workers${result.failed ? ` (${result.failed} failed)` : ''}`);
      await fetchWorkers();
      await fetchStats();
    } catch (err: any) {
      toast.error(err?.message ?? 'Pay all failed. Try again.');
    } finally {
      setPayingAll(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bgMain }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div style={{ marginLeft: 240, flex: 1, padding: '28px 32px', minWidth: 0 }}>
        <AnimatePresence mode="wait">
          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SettingsTab />
            </motion.div>
          )}
          {activeTab === 'payments' && (
            <motion.div key="payments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <PaymentsTab />
            </motion.div>
          )}
          {(activeTab === 'dashboard' || activeTab === 'workers') && (
            <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TopBar
                onAddWorker={() => setModalOpen(true)}
                onPayAll={handlePayAll}
                payingAll={payingAll}
              />
              <StatsCards stats={stats} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
                <WorkersTable
                  workers={workers}
                  loading={loadingWorkers}
                  onAddWorker={() => setModalOpen(true)}
                  onPayWorker={handlePayWorker}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <QuickPay workers={workers} onPayAll={handlePayAll} paying={payingAll} />
                  <RecentTransactions stats={stats} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AddWorkerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={fetchWorkers}
      />
    </div>
  );
}
