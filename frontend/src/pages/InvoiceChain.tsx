import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Zap, FileText, BarChart2,
  Settings, ArrowRight, Plus, X, ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ─── constants ─────────────────────────────────────────────── */
const INR_RATE = 83.3;
const toINR = (usdc: number) =>
  `₹${(usdc * INR_RATE).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',  path: '/contractor' },
  { icon: Users,           label: 'Workers',    path: '/contractor' },
  { icon: Zap,             label: 'Payments',   path: '/contractor' },
  { icon: FileText,        label: 'Invoices',   path: '/invoice'    },
  { icon: BarChart2,       label: 'Analytics',  path: '/analytics'  },
  { icon: Settings,        label: 'Settings',   path: '/contractor' },
];

type Status = 'Pending' | 'Confirmed' | 'Completed';

interface Invoice {
  id: string;
  buyerCo: string;
  sellerCo: string;
  amount: number; // USDC
  status: Status;
  due: string;
  desc: string;
}

const MOCK_INVOICES: Invoice[] = [
  { id: 'INV-001', buyerCo: 'Sharma Construction',  sellerCo: 'Steel Traders Ltd',   amount: 3600, status: 'Pending',   due: '2026-04-20', desc: 'Structural steel supply — Phase 2' },
  { id: 'INV-002', buyerCo: 'BuildFast Infra',       sellerCo: 'Cement Depot',        amount: 1200, status: 'Confirmed', due: '2026-04-18', desc: 'OPC 53-grade cement, 200 bags' },
  { id: 'INV-003', buyerCo: 'Metro Projects',        sellerCo: 'SafeWork Equipment',  amount: 840,  status: 'Completed', due: '2026-04-10', desc: 'Safety harness & helmets, Q1' },
  { id: 'INV-004', buyerCo: 'Sharma Construction',  sellerCo: 'Plywood House',       amount: 540,  status: 'Pending',   due: '2026-04-22', desc: 'Marine plywood — 80 sheets' },
  { id: 'INV-005', buyerCo: 'Rapid Builders',        sellerCo: 'Wire & Cable Co',     amount: 960,  status: 'Confirmed', due: '2026-04-19', desc: 'Electrical wiring — Site A' },
  { id: 'INV-006', buyerCo: 'Metro Projects',        sellerCo: 'Crane Hire Services', amount: 2400, status: 'Completed', due: '2026-04-05', desc: 'Tower crane rental — 30 days' },
];

const STATUS_STYLE: Record<Status, string> = {
  Pending:   'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
  Confirmed: 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30',
  Completed: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
};

const ESCROW_STEPS = [
  { icon: '📋', title: 'Create Invoice', desc: 'Buyer raises invoice on-chain with amount & terms locked in smart contract' },
  { icon: '🔒', title: 'Funds Escrowed', desc: 'USDC is locked in a trustless program account — neither party can withdraw' },
  { icon: '✅', title: 'Buyer Confirms', desc: 'Buyer confirms delivery; contract releases funds to seller automatically' },
  { icon: '⚡', title: 'Instant Settlement', desc: 'Seller receives USDC in seconds — no bank, no delay, no dispute risk' },
];

const STAGGER = { hidden: { opacity: 0, y: 14 }, show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] } }) };

/* ─── empty form state ───────────────────────────────────────── */
const EMPTY_FORM = { amount: '', buyerCo: '', buyerEmail: '', sellerCo: '', sellerEmail: '', desc: '', due: '' };

/* ─── component ─────────────────────────────────────────────── */
export default function InvoiceChain() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK_INVOICES);
  const [filter, setFilter]     = useState<'All' | Status>('All');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);

  /* stats */
  const total     = invoices.length;
  const pending   = invoices.filter(i => i.status !== 'Completed');
  const settled   = invoices.filter(i => i.status === 'Completed');
  const pendingUSDC = pending.reduce((s, i) => s + i.amount, 0);
  const settledUSDC = settled.reduce((s, i) => s + i.amount, 0);

  const displayed = filter === 'All' ? invoices : invoices.filter(i => i.status === filter);

  /* actions */
  const handleCreate = () => {
    if (!form.amount || !form.buyerCo || !form.sellerCo) {
      toast.error('Fill in amount, buyer, and seller');
      return;
    }
    const next: Invoice = {
      id:      `INV-${String(invoices.length + 1).padStart(3, '0')}`,
      buyerCo: form.buyerCo,
      sellerCo: form.sellerCo,
      amount:  parseFloat(form.amount),
      status:  'Pending',
      due:     form.due || '2026-05-01',
      desc:    form.desc || 'New invoice',
    };
    setInvoices(prev => [next, ...prev]);
    setForm(EMPTY_FORM);
    setShowForm(false);
    toast.success(`${next.id} created — escrowing ${next.amount} USDC`);
  };

  const handleConfirm = (id: string) => {
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: 'Confirmed' } : i));
    toast.success(`${id} confirmed — funds locked in escrow`);
  };

  const handleRelease = (id: string, amount: number) => {
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: 'Completed' } : i));
    toast.success(`${id} settled — ${amount} USDC released`);
  };

  return (
    <div className="flex h-screen bg-[#060B14] text-[#F0EDE8] overflow-hidden font-[DM_Sans,sans-serif]">

      {/* ── Sidebar ── */}
      <aside className="w-16 md:w-56 flex flex-col border-r border-white/[0.06] bg-[#080D18] shrink-0">
        <div className="h-16 flex items-center px-4 gap-2 border-b border-white/[0.06]">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-[#060B14] font-bold text-sm">K</div>
          <span className="hidden md:block font-semibold text-sm tracking-wide">KaamPay</span>
        </div>
        <nav className="flex-1 py-4 px-2 space-y-0.5">
          {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
            const active = label === 'Invoices';
            return (
              <button
                key={label}
                onClick={() => navigate(path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer ${
                  active
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'text-[#F0EDE8]/50 hover:text-[#F0EDE8] hover:bg-white/[0.04]'
                }`}
              >
                <Icon size={18} />
                <span className="hidden md:block">{label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-2 border-t border-white/[0.06]">
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-bold">SC</div>
            <div className="hidden md:block text-xs text-[#F0EDE8]/50 truncate">Sharma Construction</div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/[0.06] shrink-0">
          <div>
            <h1 className="text-lg font-semibold font-[Syne,sans-serif]">InvoiceChain</h1>
            <p className="text-xs text-[#F0EDE8]/40">On-chain escrow for B2B settlements</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-[#060B14] text-sm font-semibold hover:bg-amber-400 transition-colors"
          >
            <Plus size={16} />
            New Invoice
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Invoices',    val: total,                                    sub: 'all time' },
              { label: 'Pending Escrow',    val: `${pendingUSDC.toLocaleString()} USDC`,   sub: toINR(pendingUSDC) },
              { label: 'Settled Today',     val: `${settledUSDC.toLocaleString()} USDC`,   sub: toINR(settledUSDC) },
              { label: 'Avg Settlement',    val: '4.2s',                                   sub: 'on Solana' },
            ].map((c, i) => (
              <motion.div
                key={c.label}
                custom={i}
                variants={STAGGER}
                initial="hidden"
                animate="show"
                className="bg-[#080D18] border border-white/[0.06] rounded-xl p-4"
              >
                <p className="text-xs text-[#F0EDE8]/40 mb-1">{c.label}</p>
                <p className="text-xl font-semibold font-[Syne,sans-serif]">{c.val}</p>
                <p className="text-xs text-[#F0EDE8]/40 mt-0.5">{c.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* ── Invoice List ── */}
          <div className="bg-[#080D18] border border-white/[0.06] rounded-xl overflow-hidden">
            {/* Filter tabs */}
            <div className="flex items-center gap-1 px-4 py-3 border-b border-white/[0.06]">
              {(['All', 'Pending', 'Confirmed', 'Completed'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filter === f
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'text-[#F0EDE8]/40 hover:text-[#F0EDE8]/70'
                  }`}
                >
                  {f}
                </button>
              ))}
              <span className="ml-auto text-xs text-[#F0EDE8]/30">{displayed.length} invoice{displayed.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-white/[0.04]">
              <AnimatePresence>
                {displayed.map((inv, i) => (
                  <motion.div
                    key={inv.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { delay: i * 0.04 } }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-mono text-amber-400">{inv.id}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_STYLE[inv.status]}`}>{inv.status}</span>
                      </div>
                      <p className="text-sm text-[#F0EDE8]/80 truncate">{inv.desc}</p>
                      <p className="text-xs text-[#F0EDE8]/40 mt-0.5">{inv.buyerCo} → {inv.sellerCo} · Due {inv.due}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-semibold">{inv.amount.toLocaleString()} USDC</p>
                        <p className="text-xs text-[#F0EDE8]/40">{toINR(inv.amount)}</p>
                      </div>
                      <div className="flex gap-1.5">
                        {inv.status === 'Pending' && (
                          <button
                            onClick={() => handleConfirm(inv.id)}
                            className="px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-400 text-xs font-medium hover:bg-blue-500/25 transition-colors"
                          >
                            Confirm
                          </button>
                        )}
                        {inv.status !== 'Completed' && (
                          <button
                            onClick={() => handleRelease(inv.id, inv.amount)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-medium hover:bg-emerald-500/25 transition-colors"
                          >
                            Release
                          </button>
                        )}
                        {inv.status === 'Completed' && (
                          <button className="px-3 py-1.5 rounded-lg bg-white/[0.04] text-[#F0EDE8]/50 text-xs font-medium hover:bg-white/[0.08] transition-colors">
                            Receipt
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Escrow Explainer ── */}
          <div className="bg-[#080D18] border border-white/[0.06] rounded-xl p-6">
            <h2 className="text-sm font-semibold text-[#F0EDE8]/60 uppercase tracking-widest mb-5">How Escrow Works</h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              {ESCROW_STEPS.map((step, i) => (
                <div key={i} className="flex sm:flex-1 items-center gap-2 w-full">
                  <div className="flex-1 bg-[#060B14] border border-white/[0.06] rounded-xl p-4 text-center">
                    <div className="text-2xl mb-2">{step.icon}</div>
                    <p className="text-xs font-semibold mb-1">{step.title}</p>
                    <p className="text-[10px] text-[#F0EDE8]/40 leading-relaxed">{step.desc}</p>
                  </div>
                  {i < ESCROW_STEPS.length - 1 && (
                    <ArrowRight size={16} className="text-[#F0EDE8]/20 shrink-0 hidden sm:block" />
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── Create Invoice Modal ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }}
              exit={{ opacity: 0, y: 16 }}
              className="bg-[#080D18] border border-white/[0.08] rounded-2xl p-6 w-full max-w-lg"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold font-[Syne,sans-serif]">Create Invoice</h2>
                <button onClick={() => setShowForm(false)} className="text-[#F0EDE8]/40 hover:text-[#F0EDE8] transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <input
                  type="number"
                  placeholder="Amount (USDC)"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full bg-[#060B14] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-[#F0EDE8] placeholder-[#F0EDE8]/30 outline-none focus:border-amber-500/50 transition-colors"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    placeholder="Buyer Company"
                    value={form.buyerCo}
                    onChange={e => setForm(f => ({ ...f, buyerCo: e.target.value }))}
                    className="w-full bg-[#060B14] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-[#F0EDE8] placeholder-[#F0EDE8]/30 outline-none focus:border-amber-500/50 transition-colors"
                  />
                  <input
                    placeholder="Seller Company"
                    value={form.sellerCo}
                    onChange={e => setForm(f => ({ ...f, sellerCo: e.target.value }))}
                    className="w-full bg-[#060B14] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-[#F0EDE8] placeholder-[#F0EDE8]/30 outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="email"
                    placeholder="Buyer Email"
                    value={form.buyerEmail}
                    onChange={e => setForm(f => ({ ...f, buyerEmail: e.target.value }))}
                    className="w-full bg-[#060B14] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-[#F0EDE8] placeholder-[#F0EDE8]/30 outline-none focus:border-amber-500/50 transition-colors"
                  />
                  <input
                    type="email"
                    placeholder="Seller Email"
                    value={form.sellerEmail}
                    onChange={e => setForm(f => ({ ...f, sellerEmail: e.target.value }))}
                    className="w-full bg-[#060B14] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-[#F0EDE8] placeholder-[#F0EDE8]/30 outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>
                <input
                  placeholder="Description"
                  value={form.desc}
                  onChange={e => setForm(f => ({ ...f, desc: e.target.value }))}
                  className="w-full bg-[#060B14] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-[#F0EDE8] placeholder-[#F0EDE8]/30 outline-none focus:border-amber-500/50 transition-colors"
                />
                <div className="flex items-center gap-2">
                  <ChevronDown size={14} className="text-[#F0EDE8]/30" />
                  <label className="text-xs text-[#F0EDE8]/40">Due Date</label>
                  <input
                    type="date"
                    value={form.due}
                    onChange={e => setForm(f => ({ ...f, due: e.target.value }))}
                    className="ml-auto bg-[#060B14] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-[#F0EDE8] outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-lg border border-white/[0.08] text-sm text-[#F0EDE8]/50 hover:text-[#F0EDE8] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="flex-1 py-2.5 rounded-lg bg-amber-500 text-[#060B14] text-sm font-semibold hover:bg-amber-400 transition-colors"
                >
                  Create &amp; Escrow
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
