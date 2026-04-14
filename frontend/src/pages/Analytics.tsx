import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, Zap, FileText, BarChart2, Settings,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
  BarChart, Bar,
} from 'recharts';

/* ─── nav ─────────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',  path: '/contractor' },
  { icon: Users,           label: 'Workers',    path: '/contractor' },
  { icon: Zap,             label: 'Payments',   path: '/contractor' },
  { icon: FileText,        label: 'Invoices',   path: '/invoice'    },
  { icon: BarChart2,       label: 'Analytics',  path: '/analytics'  },
  { icon: Settings,        label: 'Settings',   path: '/contractor' },
];

/* ─── mock data ───────────────────────────────────────────────── */
const DAILY_DATA = [
  { day: 'Apr 1',  usdc: 820  },
  { day: 'Apr 2',  usdc: 1140 },
  { day: 'Apr 3',  usdc: 680  },
  { day: 'Apr 4',  usdc: 1360 },
  { day: 'Apr 5',  usdc: 940  },
  { day: 'Apr 6',  usdc: 1520 },
  { day: 'Apr 7',  usdc: 760  },
  { day: 'Apr 8',  usdc: 1080 },
  { day: 'Apr 9',  usdc: 1700 },
  { day: 'Apr 10', usdc: 1250 },
  { day: 'Apr 11', usdc: 890  },
  { day: 'Apr 12', usdc: 1430 },
  { day: 'Apr 13', usdc: 1120 },
  { day: 'Apr 14', usdc: 1760 },
];

const PIE_DATA = [
  { name: 'InstaPay',     value: 65, color: '#F59E0B' },
  { name: 'InvoiceChain', value: 25, color: '#3B82F6' },
  { name: 'HomeRemit',    value: 10, color: '#10B981' },
];

const TOP_WORKERS = [
  { name: 'Ravi Kumar',    usdc: 842 },
  { name: 'Priya Sharma',  usdc: 710 },
  { name: 'Ankit Singh',   usdc: 630 },
  { name: 'Meena Devi',    usdc: 580 },
  { name: 'Suresh Patel',  usdc: 510 },
];

const ACTIVITY = [
  { type: 'InstaPay',     amount: '120 USDC', dir: 'Sharma → Ravi Kumar',    time: '2m ago',  status: 'Settled',  hash: '3xK7…mP2' },
  { type: 'InvoiceChain', amount: '3600 USDC', dir: 'Metro → Steel Traders', time: '8m ago',  status: 'Released', hash: '9aB3…qR1' },
  { type: 'HomeRemit',    amount: '200 USDC', dir: 'Priya → Family (Bihar)', time: '15m ago', status: 'Settled',  hash: '7cF2…wN5' },
  { type: 'InstaPay',     amount: '90 USDC',  dir: 'BuildFast → Ankit',     time: '23m ago', status: 'Settled',  hash: '1mK9…xT4' },
  { type: 'InvoiceChain', amount: '1200 USDC', dir: 'BuildFast → Cement',   time: '41m ago', status: 'Confirmed', hash: '6pL4…bU8' },
  { type: 'InstaPay',     amount: '150 USDC', dir: 'Sharma → Meena',        time: '1h ago',  status: 'Settled',  hash: '2nQ7…vZ3' },
  { type: 'HomeRemit',    amount: '300 USDC', dir: 'Ravi → Family (UP)',    time: '2h ago',  status: 'Settled',  hash: '8sW1…jA6' },
  { type: 'InstaPay',     amount: '75 USDC',  dir: 'Metro → Suresh',       time: '3h ago',  status: 'Settled',  hash: '4hE5…oD9' },
  { type: 'InvoiceChain', amount: '960 USDC', dir: 'Rapid → Wire & Cable', time: '4h ago',  status: 'Pending',  hash: '5rT6…kG2' },
  { type: 'InstaPay',     amount: '110 USDC', dir: 'Sharma → Ankit',       time: '5h ago',  status: 'Settled',  hash: '0uY8…cH7' },
];

const STATUS_STYLE: Record<string, string> = {
  Settled:   'bg-emerald-500/15 text-emerald-400',
  Released:  'bg-emerald-500/15 text-emerald-400',
  Confirmed: 'bg-blue-500/15 text-blue-400',
  Pending:   'bg-amber-500/15 text-amber-400',
};

const STAGGER = { hidden: { opacity: 0, y: 14 }, show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] } }) };

/* ─── custom tooltip ─────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#080D18] border border-white/[0.08] rounded-lg px-3 py-2 text-xs">
      <p className="text-[#F0EDE8]/40 mb-0.5">{label}</p>
      <p className="text-amber-400 font-semibold">{payload[0].value.toLocaleString()} USDC</p>
    </div>
  );
}

/* ─── component ─────────────────────────────────────────────── */
export default function Analytics() {
  const navigate = useNavigate();

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
            const active = label === 'Analytics';
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
        <header className="h-16 flex items-center px-6 border-b border-white/[0.06] shrink-0">
          <div>
            <h1 className="text-lg font-semibold font-[Syne,sans-serif]">Analytics</h1>
            <p className="text-xs text-[#F0EDE8]/40">Payment insights &amp; on-chain activity</p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Volume',       val: '12,450 USDC', sub: '↑ 18% vs last week' },
              { label: 'Workers Paid',       val: '847',         sub: '↑ 23 new this week'  },
              { label: 'Invoices Settled',   val: '124',         sub: '₹1.03Cr total value' },
              { label: 'Avg Payment Time',   val: '3.2s',        sub: 'on Solana devnet'    },
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
                <p className="text-xs text-emerald-400 mt-0.5">{c.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* ── Charts row ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Line chart — 2/3 */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.28, duration: 0.4, ease: [0.16, 1, 0.3, 1] } }}
              className="lg:col-span-2 bg-[#080D18] border border-white/[0.06] rounded-xl p-5"
            >
              <p className="text-sm font-medium mb-4">Daily Payments (USDC)</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={DAILY_DATA} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="day" tick={{ fill: 'rgba(240,237,232,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
                  <YAxis tick={{ fill: 'rgba(240,237,232,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="usdc" stroke="#F59E0B" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#F59E0B' }} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Pie chart — 1/3 */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.35, duration: 0.4, ease: [0.16, 1, 0.3, 1] } }}
              className="bg-[#080D18] border border-white/[0.06] rounded-xl p-5"
            >
              <p className="text-sm font-medium mb-4">Payment Mix</p>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={48} outerRadius={68} dataKey="value" strokeWidth={0}>
                    {PIE_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v}%`]} contentStyle={{ background: '#080D18', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.5rem', fontSize: '12px', color: '#F0EDE8' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {PIE_DATA.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                      <span className="text-[#F0EDE8]/60">{d.name}</span>
                    </div>
                    <span className="font-medium">{d.value}%</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ── Bar chart + Activity table ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Bar chart — top workers */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.42, duration: 0.4, ease: [0.16, 1, 0.3, 1] } }}
              className="bg-[#080D18] border border-white/[0.06] rounded-xl p-5"
            >
              <p className="text-sm font-medium mb-4">Top Workers (USDC earned)</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={TOP_WORKERS} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fill: 'rgba(240,237,232,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(240,237,232,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip formatter={(v) => [`${v} USDC`]} contentStyle={{ background: '#080D18', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.5rem', fontSize: '12px', color: '#F0EDE8' }} />
                  <Bar dataKey="usdc" fill="#F59E0B" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Recent Activity — 2/3 */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.49, duration: 0.4, ease: [0.16, 1, 0.3, 1] } }}
              className="lg:col-span-2 bg-[#080D18] border border-white/[0.06] rounded-xl overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-white/[0.06]">
                <p className="text-sm font-medium">Recent Activity</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      {['Type', 'Amount', 'From / To', 'Time', 'Status', 'TX Hash'].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left font-medium text-[#F0EDE8]/30">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {ACTIVITY.map((a, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-2.5 font-medium text-[#F0EDE8]/70">{a.type}</td>
                        <td className="px-4 py-2.5 text-amber-400 font-semibold">{a.amount}</td>
                        <td className="px-4 py-2.5 text-[#F0EDE8]/50 max-w-[140px] truncate">{a.dir}</td>
                        <td className="px-4 py-2.5 text-[#F0EDE8]/40">{a.time}</td>
                        <td className="px-4 py-2.5">
                          <span className={`px-1.5 py-0.5 rounded-full font-medium ${STATUS_STYLE[a.status] ?? ''}`}>{a.status}</span>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-[#F0EDE8]/30">{a.hash}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}
