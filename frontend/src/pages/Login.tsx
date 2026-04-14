import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

const C = {
  bg:      '#060B14',
  surface: '#080D18',
  primary: '#F59E0B',
  text:    '#F0EDE8',
  muted:   'rgba(240,237,232,0.5)',
  border:  'rgba(255,255,255,0.08)',
  border2: 'rgba(255,255,255,0.05)',
  green:   '#34D399',
} as const;
const FS = 'Syne, sans-serif';
const FD = 'DM Sans, sans-serif';
const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const INPUT: React.CSSProperties = {
  width: '100%', padding: '11px 14px',
  background: 'rgba(255,255,255,0.04)',
  border: `1px solid ${C.border}`,
  borderRadius: 9, color: C.text,
  fontFamily: FD, fontSize: 14, outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.18s',
};

function PwdInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ ...INPUT, paddingRight: 42 }}
        onFocus={e => (e.target.style.borderColor = 'rgba(245,158,11,0.5)')}
        onBlur={e => (e.target.style.borderColor = C.border)}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer', color: C.muted,
          display: 'flex', padding: 0,
        }}
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ── Contractor Forms ──────────────────────────────────────────────────────────
function ContractorRegister({ onSuccess: _onSuccess }: { onSuccess: () => void }) {
  const navigate = useNavigate();
  const [f, setF] = useState({ company: '', name: '', email: '', password: '', confirm: '', wallet: '' });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF(p => ({ ...p, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.company || !f.name || !f.email || !f.password) { toast.error('Please fill all required fields'); return; }
    if (f.password !== f.confirm) { toast.error('Passwords do not match'); return; }
    const user = { type: 'contractor', name: f.name, email: f.email, company: f.company, id: uid(), wallet: f.wallet };
    localStorage.setItem('kp_user', JSON.stringify(user));
    toast.success(`Welcome, ${f.name}!`);
    navigate('/contractor');
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={{ display: 'block', fontSize: 12, color: C.muted, fontFamily: FD, marginBottom: 6 }}>Company / Business Name *</label>
        <input value={f.company} onChange={set('company')} placeholder="e.g. Sharma Construction" style={INPUT}
          onFocus={e => (e.target.style.borderColor = 'rgba(245,158,11,0.5)')} onBlur={e => (e.target.style.borderColor = C.border)} />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, color: C.muted, fontFamily: FD, marginBottom: 6 }}>Your Full Name *</label>
        <input value={f.name} onChange={set('name')} placeholder="e.g. Rajesh Sharma" style={INPUT}
          onFocus={e => (e.target.style.borderColor = 'rgba(245,158,11,0.5)')} onBlur={e => (e.target.style.borderColor = C.border)} />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, color: C.muted, fontFamily: FD, marginBottom: 6 }}>Email *</label>
        <input type="email" value={f.email} onChange={set('email')} placeholder="rajesh@sharma.com" style={INPUT}
          onFocus={e => (e.target.style.borderColor = 'rgba(245,158,11,0.5)')} onBlur={e => (e.target.style.borderColor = C.border)} />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, color: C.muted, fontFamily: FD, marginBottom: 6 }}>Password *</label>
        <PwdInput value={f.password} onChange={v => setF(p => ({ ...p, password: v }))} placeholder="Min 8 characters" />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, color: C.muted, fontFamily: FD, marginBottom: 6 }}>Confirm Password *</label>
        <PwdInput value={f.confirm} onChange={v => setF(p => ({ ...p, confirm: v }))} placeholder="Repeat password" />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, color: C.muted, fontFamily: FD, marginBottom: 6 }}>Wallet Address <span style={{ opacity: 0.5 }}>(optional)</span></label>
        <input value={f.wallet} onChange={set('wallet')} placeholder="Solana wallet address" style={{ ...INPUT, fontFamily: 'ui-monospace,monospace', fontSize: 12 }}
          onFocus={e => (e.target.style.borderColor = 'rgba(245,158,11,0.5)')} onBlur={e => (e.target.style.borderColor = C.border)} />
      </div>
      <button type="submit" style={{
        width: '100%', padding: '12px', background: C.primary, border: 'none',
        borderRadius: 9, color: '#060B14', fontFamily: FD, fontWeight: 700,
        fontSize: 15, cursor: 'pointer', marginTop: 4, transition: 'opacity 0.18s',
      }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.86')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        Register as Contractor
      </button>
    </form>
  );
}

function ContractorLogin() {
  const navigate = useNavigate();
  const [f, setF] = useState({ email: '', password: '' });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF(p => ({ ...p, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.email || !f.password) { toast.error('Enter email and password'); return; }
    // Check if user exists in localStorage (demo auth)
    const stored = localStorage.getItem('kp_user');
    if (stored) {
      const u = JSON.parse(stored);
      if (u.email === f.email && u.type === 'contractor') {
        toast.success(`Welcome back, ${u.name}!`);
        navigate('/contractor');
        return;
      }
    }
    // Demo: create session for any contractor login
    const user = { type: 'contractor', name: f.email.split('@')[0], email: f.email, id: uid(), company: 'My Company' };
    localStorage.setItem('kp_user', JSON.stringify(user));
    toast.success('Logged in!');
    navigate('/contractor');
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={{ display: 'block', fontSize: 12, color: C.muted, fontFamily: FD, marginBottom: 6 }}>Email</label>
        <input type="email" value={f.email} onChange={set('email')} placeholder="contractor@company.com" style={INPUT}
          onFocus={e => (e.target.style.borderColor = 'rgba(245,158,11,0.5)')} onBlur={e => (e.target.style.borderColor = C.border)} />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, color: C.muted, fontFamily: FD, marginBottom: 6 }}>Password</label>
        <PwdInput value={f.password} onChange={v => setF(p => ({ ...p, password: v }))} placeholder="Your password" />
      </div>
      <div style={{ textAlign: 'right' }}>
        <button type="button" style={{ background: 'none', border: 'none', color: C.primary, fontFamily: FD, fontSize: 13, cursor: 'pointer' }}>
          Forgot Password?
        </button>
      </div>
      <button type="submit" style={{
        width: '100%', padding: '12px', background: C.primary, border: 'none',
        borderRadius: 9, color: '#060B14', fontFamily: FD, fontWeight: 700,
        fontSize: 15, cursor: 'pointer', transition: 'opacity 0.18s',
      }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.86')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        Login
      </button>
    </form>
  );
}

// ── Worker Forms ──────────────────────────────────────────────────────────────
function WorkerRegister() {
  const navigate = useNavigate();
  const [f, setF] = useState({ name: '', phone: '', aadhaar: '', password: '', confirm: '' });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF(p => ({ ...p, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name || !f.phone || !f.password) { toast.error('Please fill all required fields'); return; }
    if (f.password !== f.confirm) { toast.error('Passwords do not match'); return; }
    if (f.aadhaar && f.aadhaar.length !== 4) { toast.error('Enter last 4 digits of Aadhaar'); return; }
    const user = { type: 'worker', name: f.name, email: f.phone, phone: f.phone, id: uid() };
    localStorage.setItem('kp_user', JSON.stringify(user));
    toast.success(`Welcome, ${f.name}!`);
    navigate('/worker');
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={{ display: 'block', fontSize: 12, color: C.muted, fontFamily: FD, marginBottom: 6 }}>Full Name *</label>
        <input value={f.name} onChange={set('name')} placeholder="e.g. Ramesh Kumar" style={INPUT}
          onFocus={e => (e.target.style.borderColor = 'rgba(245,158,11,0.5)')} onBlur={e => (e.target.style.borderColor = C.border)} />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, color: C.muted, fontFamily: FD, marginBottom: 6 }}>Phone Number *</label>
        <input type="tel" value={f.phone} onChange={set('phone')} placeholder="9876543210" style={INPUT}
          onFocus={e => (e.target.style.borderColor = 'rgba(245,158,11,0.5)')} onBlur={e => (e.target.style.borderColor = C.border)} />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, color: C.muted, fontFamily: FD, marginBottom: 6 }}>Aadhaar Last 4 Digits <span style={{ opacity: 0.5 }}>(for verification)</span></label>
        <input value={f.aadhaar} onChange={set('aadhaar')} placeholder="e.g. 4521" maxLength={4} style={INPUT}
          onFocus={e => (e.target.style.borderColor = 'rgba(245,158,11,0.5)')} onBlur={e => (e.target.style.borderColor = C.border)} />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, color: C.muted, fontFamily: FD, marginBottom: 6 }}>Password *</label>
        <PwdInput value={f.password} onChange={v => setF(p => ({ ...p, password: v }))} placeholder="Min 8 characters" />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, color: C.muted, fontFamily: FD, marginBottom: 6 }}>Confirm Password *</label>
        <PwdInput value={f.confirm} onChange={v => setF(p => ({ ...p, confirm: v }))} placeholder="Repeat password" />
      </div>
      <button type="submit" style={{
        width: '100%', padding: '12px', background: C.primary, border: 'none',
        borderRadius: 9, color: '#060B14', fontFamily: FD, fontWeight: 700,
        fontSize: 15, cursor: 'pointer', marginTop: 4, transition: 'opacity 0.18s',
      }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.86')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        Register as Worker
      </button>
    </form>
  );
}

function WorkerLogin() {
  const navigate = useNavigate();
  const [f, setF] = useState({ phone: '', password: '' });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF(p => ({ ...p, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.phone || !f.password) { toast.error('Enter phone and password'); return; }
    const stored = localStorage.getItem('kp_user');
    if (stored) {
      const u = JSON.parse(stored);
      if ((u.phone === f.phone || u.email === f.phone) && u.type === 'worker') {
        toast.success(`Welcome back, ${u.name}!`);
        navigate('/worker');
        return;
      }
    }
    const user = { type: 'worker', name: 'Worker', email: f.phone, phone: f.phone, id: uid() };
    localStorage.setItem('kp_user', JSON.stringify(user));
    toast.success('Logged in!');
    navigate('/worker');
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={{ display: 'block', fontSize: 12, color: C.muted, fontFamily: FD, marginBottom: 6 }}>Phone Number</label>
        <input type="tel" value={f.phone} onChange={set('phone')} placeholder="9876543210" style={INPUT}
          onFocus={e => (e.target.style.borderColor = 'rgba(245,158,11,0.5)')} onBlur={e => (e.target.style.borderColor = C.border)} />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, color: C.muted, fontFamily: FD, marginBottom: 6 }}>Password</label>
        <PwdInput value={f.password} onChange={v => setF(p => ({ ...p, password: v }))} placeholder="Your password" />
      </div>
      <div style={{ textAlign: 'right' }}>
        <button type="button" style={{ background: 'none', border: 'none', color: C.primary, fontFamily: FD, fontSize: 13, cursor: 'pointer' }}>
          Forgot Password?
        </button>
      </div>
      <button type="submit" style={{
        width: '100%', padding: '12px', background: C.primary, border: 'none',
        borderRadius: 9, color: '#060B14', fontFamily: FD, fontWeight: 700,
        fontSize: 15, cursor: 'pointer', transition: 'opacity 0.18s',
      }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.86')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        Login
      </button>
    </form>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Login() {
  const [searchParams] = useSearchParams();
  const defaultType = searchParams.get('type') === 'worker' ? 'worker' : 'contractor';

  const [userType, setUserType] = useState<'contractor' | 'worker'>(defaultType);
  const [mode, setMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    setUserType(defaultType);
  }, [defaultType]);

  return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE }}
        style={{
          width: '100%', maxWidth: 440,
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 20, padding: '32px 32px 36px',
        }}
      >
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 28 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={17} color="#060B14" strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: FS, fontWeight: 800, fontSize: 20, color: C.text }}>KaamPay</span>
        </Link>

        {/* User type tabs */}
        <div style={{
          display: 'flex', background: 'rgba(255,255,255,0.04)',
          borderRadius: 10, padding: 4, marginBottom: 24,
          border: `1px solid ${C.border2}`,
        }}>
          {(['contractor', 'worker'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setUserType(t); setMode('login'); }}
              style={{
                flex: 1, padding: '8px', borderRadius: 7, border: 'none', cursor: 'pointer',
                background: userType === t ? C.primary : 'transparent',
                color: userType === t ? '#060B14' : C.muted,
                fontFamily: FD, fontWeight: userType === t ? 700 : 400, fontSize: 14,
                transition: 'all 0.18s',
              }}
            >
              {t === 'contractor' ? 'Contractor' : 'Worker'}
            </button>
          ))}
        </div>

        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 20, marginBottom: 24, borderBottom: `1px solid ${C.border2}`, paddingBottom: 16 }}>
          {(['login', 'register'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: FS, fontWeight: 700, fontSize: 16,
                color: mode === m ? C.text : C.muted,
                borderBottom: mode === m ? `2px solid ${C.primary}` : '2px solid transparent',
                paddingBottom: 6, transition: 'color 0.18s',
              }}
            >
              {m === 'login' ? 'Login' : 'Register'}
            </button>
          ))}
        </div>

        {/* Form */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${userType}-${mode}`}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {userType === 'contractor' && mode === 'login'    && <ContractorLogin />}
            {userType === 'contractor' && mode === 'register' && <ContractorRegister onSuccess={() => setMode('login')} />}
            {userType === 'worker'     && mode === 'login'    && <WorkerLogin />}
            {userType === 'worker'     && mode === 'register' && <WorkerRegister />}
          </motion.div>
        </AnimatePresence>

        {/* Back to landing */}
        <p style={{ textAlign: 'center', marginTop: 24, fontFamily: FD, fontSize: 13, color: C.muted }}>
          <Link to="/" style={{ color: C.primary }}>← Back to home</Link>
        </p>
      </motion.div>
    </div>
  );
}
