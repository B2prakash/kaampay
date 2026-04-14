import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Zap, FileText, ArrowUpRight, ArrowRight,
  Menu, X, ChevronRight,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:       '#060B14',
  primary:  '#F59E0B',
  text:     '#F0EDE8',
  muted:    'rgba(240,237,232,0.5)',
  muted2:   'rgba(240,237,232,0.28)',
  cardBg:   'rgba(255,255,255,0.03)',
  border:   'rgba(255,255,255,0.08)',
  green:    '#34D399',
} as const;

// ─── Motion Variants ───────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const } },
};

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.11 } },
};

// ─── Shared Styles ─────────────────────────────────────────────────────────────
const container: React.CSSProperties = {
  maxWidth: 1180,
  margin: '0 auto',
  padding: '0 24px',
  width: '100%',
};

const sectionLabel: React.CSSProperties = {
  color: C.primary,
  fontSize: 11,
  fontWeight: 600,
  fontFamily: 'DM Sans, sans-serif',
  letterSpacing: '0.13em',
  textTransform: 'uppercase',
  marginBottom: 14,
};

// ─── Navbar ────────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: 'InstaPay',     href: '#instapay'     },
  { label: 'InvoiceChain', href: '#invoicechain'  },
  { label: 'HomeRemit',    href: '#homeremit'     },
  { label: 'Analytics',    href: '#analytics'     },
];

function Navbar() {
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handle, { passive: true });
    return () => window.removeEventListener('scroll', handle);
  }, []);

  return (
    <header
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background:     scrolled ? 'rgba(6,11,20,0.88)' : 'transparent',
        backdropFilter: scrolled ? 'blur(18px) saturate(1.4)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(18px) saturate(1.4)' : 'none',
        borderBottom:   scrolled ? `1px solid ${C.border}` : '1px solid transparent',
        transition:     'background 0.3s, backdrop-filter 0.3s, border-color 0.3s',
      }}
    >
      {/* Main nav row */}
      <div style={{ ...container, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 21, color: C.text, letterSpacing: '-0.4px' }}>
            KaamPay
          </span>
          <span className="pulse-dot" />
        </div>

        {/* Desktop links */}
        <nav className="hidden md:flex" style={{ gap: 38, alignItems: 'center' }}>
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              style={{ color: C.muted, fontSize: 14, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.18s', letterSpacing: '0.01em' }}
              onMouseEnter={e => (e.currentTarget.style.color = C.text)}
              onMouseLeave={e => (e.currentTarget.style.color = C.muted)}
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link
            to="/login?type=contractor"
            style={{
              background: C.primary, color: C.bg,
              padding: '8px 20px', borderRadius: 8,
              fontSize: 14, fontWeight: 600,
              fontFamily: 'DM Sans, sans-serif',
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'opacity 0.18s, transform 0.18s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.86'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1';    e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            Get Started
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="flex md:hidden"
            aria-label="Toggle menu"
            style={{ background: 'none', border: 'none', color: C.text, cursor: 'pointer', padding: 4, lineHeight: 0 }}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex md:hidden flex-col"
          style={{ background: 'rgba(6,11,20,0.97)', borderTop: `1px solid ${C.border}`, padding: '8px 24px 24px' }}
        >
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              onClick={() => setMobileOpen(false)}
              style={{
                color: C.text, fontSize: 17,
                fontFamily: 'DM Sans, sans-serif',
                padding: '14px 0',
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              {label}
            </a>
          ))}
        </motion.div>
      )}
    </header>
  );
}

// ─── Hero ──────────────────────────────────────────────────────────────────────
const HERO_STATS = ['450M workers', '₹10.7L Cr unlocked', '0.1% fees'];

function Hero() {
  return (
    <section
      style={{
        minHeight: '100vh', position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '112px 24px 80px',
      }}
    >
      {/* Animated grid */}
      <div className="hero-grid" style={{ position: 'absolute', inset: 0, zIndex: 0 }} />

      {/* Radial vignette — fades grid toward edges */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: `radial-gradient(ellipse 90% 70% at 40% 50%, transparent 15%, ${C.bg} 75%)`,
      }} />

      {/* Ambient amber glow */}
      <div style={{
        position: 'absolute', top: '38%', left: '28%', transform: 'translate(-50%, -50%)',
        width: 700, height: 700, borderRadius: '50%', zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(245,158,11,0.055) 0%, transparent 68%)',
      }} />

      {/* Content */}
      <div style={{ ...container, position: 'relative', zIndex: 2 }}>
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          style={{ maxWidth: 760 }}
        >
          {/* Country badge */}
          <motion.div variants={fadeUp} style={{ marginBottom: 28 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(245,158,11,0.07)',
              border: '1px solid rgba(245,158,11,0.22)',
              color: C.primary, padding: '5px 16px', borderRadius: 100,
              fontSize: 13, fontFamily: 'DM Sans, sans-serif', fontWeight: 500,
              letterSpacing: '0.01em',
            }}>
              🇮🇳 Built for Bharat · Powered by Solana
            </span>
          </motion.div>

          {/* Floating stat pills */}
          <motion.div
            variants={fadeUp}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 36 }}
          >
            {HERO_STATS.map((stat, i) => (
              <motion.span
                key={stat}
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, delay: i * 1.3, ease: 'easeInOut' }}
                style={{
                  background: 'rgba(255,255,255,0.035)',
                  border: `1px solid ${C.border}`,
                  color: C.muted,
                  padding: '5px 16px', borderRadius: 100,
                  fontSize: 13, fontFamily: 'DM Sans, sans-serif',
                }}
              >
                {stat}
              </motion.span>
            ))}
          </motion.div>

          {/* Main headline */}
          <motion.h1
            variants={fadeUp}
            style={{
              fontFamily: 'Syne, sans-serif', fontWeight: 800,
              fontSize: 'clamp(44px, 7.5vw, 76px)',
              lineHeight: 1.03, letterSpacing: '-2.5px',
              marginBottom: 24,
            }}
          >
            <span style={{ color: C.text, display: 'block' }}>Get paid today.</span>
            <span style={{ color: C.primary, display: 'block' }}>Not in 90 days.</span>
          </motion.h1>

          {/* Sub-headline */}
          <motion.p
            variants={fadeUp}
            style={{
              color: C.muted,
              fontSize: 'clamp(16px, 2.2vw, 20px)',
              lineHeight: 1.72, fontFamily: 'DM Sans, sans-serif',
              fontWeight: 300, maxWidth: 520, marginBottom: 44,
            }}
          >
            Instant USDC wages for 450M Indian workers.<br />
            Zero middlemen. Zero delays. Zero fees.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUp}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}
          >
            <Link
              to="/login?type=contractor"
              style={{
                background: C.primary, color: C.bg,
                padding: '14px 28px', borderRadius: 10,
                fontSize: 15, fontWeight: 600,
                fontFamily: 'DM Sans, sans-serif',
                display: 'inline-flex', alignItems: 'center', gap: 7,
                transition: 'opacity 0.18s, transform 0.18s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.86'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1';    e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Start as Contractor <ChevronRight size={16} />
            </Link>

            <Link
              to="/login?type=worker"
              style={{
                background: 'transparent',
                border: `1px solid ${C.border}`,
                color: C.text,
                padding: '14px 28px', borderRadius: 10,
                fontSize: 15, fontWeight: 400,
                fontFamily: 'DM Sans, sans-serif',
                display: 'inline-flex', alignItems: 'center', gap: 7,
                transition: 'border-color 0.18s, transform 0.18s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.24)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Worker Login
            </Link>

            <Link
              to="/login?type=contractor"
              style={{
                color: C.muted,
                fontSize: 14, fontFamily: 'DM Sans, sans-serif',
                display: 'inline-flex', alignItems: 'center', gap: 5,
                transition: 'color 0.18s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = C.text)}
              onMouseLeave={e => (e.currentTarget.style.color = C.muted)}
            >
              Go to Dashboard →
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Live Stats Bar ────────────────────────────────────────────────────────────
const STATS = [
  { value: '450M+',         label: 'Workers waiting'  },
  { value: '₹10.7L Crore', label: 'Invoices locked'  },
  { value: '6.5% → 0.1%',  label: 'Fee reduction'    },
];

function StatsBar() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}
    >
      <div style={{ ...container }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
        }}>
          {STATS.map((stat, i) => (
            <div
              key={stat.value}
              style={{
                padding: 'clamp(28px, 5vw, 48px) clamp(16px, 3vw, 40px)',
                borderRight: i < STATS.length - 1 ? `1px solid ${C.border}` : 'none',
                textAlign: i === 0 ? 'left' : i === 1 ? 'center' : 'right',
              }}
            >
              <div style={{
                fontFamily: 'Syne, sans-serif', fontWeight: 700,
                fontSize: 'clamp(26px, 4vw, 42px)',
                color: C.text, letterSpacing: '-1px', marginBottom: 7,
              }}>
                {stat.value}
              </div>
              <div style={{ color: C.muted, fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

// ─── Feature Cards ─────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon:      <Zap size={20} />,
    iconBg:    'rgba(245,158,11,0.14)',
    iconColor: '#F59E0B',
    title:     'InstaPay',
    subtitle:  'Programmable B2B Finance',
    body:      'Contractors pay daily wages in USDC instantly. Workers receive same day, every day. Private via Umbra SDK.',
    tag:       'Live on Solana',
    tagBg:     'rgba(245,158,11,0.12)',
    tagBorder: 'rgba(245,158,11,0.3)',
    tagColor:  '#F59E0B',
    id:        'instapay',
    path:      '/login?type=contractor',
    btnLabel:  'Start Paying Workers',
  },
  {
    icon:      <FileText size={20} />,
    iconBg:    'rgba(59,130,246,0.12)',
    iconColor: '#60A5FA',
    title:     'InvoiceChain',
    subtitle:  'Supply Chain Payments',
    body:      'SME invoices settled in seconds, not 90 days. Smart escrow releases on delivery confirmation.',
    tag:       'Escrow Protected',
    tagBg:     'rgba(59,130,246,0.12)',
    tagBorder: 'rgba(59,130,246,0.3)',
    tagColor:  '#60A5FA',
    id:        'invoicechain',
    path:      '/login?type=contractor',
    btnLabel:  'Create Invoice',
  },
  {
    icon:      <ArrowUpRight size={20} />,
    iconBg:    'rgba(52,211,153,0.1)',
    iconColor: '#34D399',
    title:     'HomeRemit',
    subtitle:  'Consumer Remittance',
    body:      'Send USDC to family at 0.1% fee. Not 6.5%. Arrives in 2 seconds. Not 3 days.',
    tag:       'Near-Zero Fees',
    tagBg:     'rgba(52,211,153,0.12)',
    tagBorder: 'rgba(52,211,153,0.3)',
    tagColor:  '#34D399',
    id:        'homeremit',
    path:      '/login?type=worker',
    btnLabel:  'Send Money Home',
  },
];

function FeatureCard({ f }: { f: typeof FEATURES[0] }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);

  return (
    <motion.div
      variants={fadeUp}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(f.path)}
      id={f.id}
      style={{
        background:   C.cardBg,
        border:       `1px solid ${hovered ? 'rgba(245,158,11,0.35)' : C.border}`,
        borderRadius: 16,
        padding:      '32px 28px',
        display:      'flex', flexDirection: 'column', gap: 20,
        cursor:       'pointer',
        transform:    hovered ? 'translateY(-7px)' : 'translateY(0)',
        boxShadow:    hovered
          ? '0 24px 48px rgba(0,0,0,0.45), 0 0 0 1px rgba(245,158,11,0.08)'
          : '0 2px 12px rgba(0,0,0,0.22)',
        transition: 'border-color 0.25s, transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s',
      }}
    >
      {/* Icon circle */}
      <div style={{
        width: 46, height: 46, borderRadius: 12,
        background: f.iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: f.iconColor,
      }}>
        {f.icon}
      </div>

      {/* Title block */}
      <div>
        <h3 style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 700,
          fontSize: 22, color: C.text, marginBottom: 5,
        }}>
          {f.title}
        </h3>
        <p style={{ color: C.muted, fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>
          {f.subtitle}
        </p>
      </div>

      {/* Body */}
      <p style={{
        color: C.muted, fontSize: 15,
        fontFamily: 'DM Sans, sans-serif',
        lineHeight: 1.68, flexGrow: 1,
      }}>
        {f.body}
      </p>

      {/* Footer row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Tag */}
        <span style={{
          background: f.tagBg,
          border:     `1px solid ${f.tagBorder}`,
          color:      f.tagColor,
          padding:    '4px 13px', borderRadius: 100,
          fontSize: 12, fontFamily: 'DM Sans, sans-serif', fontWeight: 600,
        }}>
          {f.tag}
        </span>

        {/* Arrow button */}
        <button
          onClick={e => { e.stopPropagation(); navigate(f.path); }}
          onMouseEnter={() => setBtnHovered(true)}
          onMouseLeave={() => setBtnHovered(false)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
            background: btnHovered ? C.primary : 'transparent',
            border: `1px solid ${btnHovered ? C.primary : 'rgba(255,255,255,0.2)'}`,
            color: btnHovered ? '#060B14' : C.text,
            fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 500,
            transition: 'background 0.2s, color 0.2s, border-color 0.2s',
          }}
        >
          {f.btnLabel} <ArrowRight size={13} style={{
            transform: hovered ? 'translateX(3px)' : 'translateX(0)',
            transition: 'transform 0.2s',
          }} />
        </button>
      </div>
    </motion.div>
  );
}

function FeaturesSection() {
  return (
    <section style={{ padding: 'clamp(64px,10vw,104px) 24px' }}>
      <div style={{ ...container }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: 52 }}
        >
          <p style={sectionLabel}>Three products. One platform.</p>
          <h2 style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 700,
            fontSize: 'clamp(28px, 4vw, 44px)',
            color: C.text, letterSpacing: '-0.5px',
          }}>
            Built for the real India
          </h2>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-48px' }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20,
          }}
        >
          {FEATURES.map(f => <FeatureCard key={f.id} f={f} />)}
        </motion.div>
      </div>
    </section>
  );
}

// ─── How It Works ──────────────────────────────────────────────────────────────
const STEPS = [
  {
    number: '01',
    title:  'Connect Wallet',
    desc:   'Link Phantom or Solflare in one tap. No sign-up forms, no KYC delays, no bank accounts needed.',
  },
  {
    number: '02',
    title:  'Register Workers',
    desc:   'Add worker names and daily wages. 30 seconds per worker. Works for construction crews to delivery fleets.',
  },
  {
    number: '03',
    title:  'Pay Instantly',
    desc:   'One click. USDC hits every wallet on Solana in under 2 seconds. Workers see it in real-time.',
  },
];

function HowItWorks() {
  return (
    <section
      id="analytics"
      style={{
        padding: 'clamp(64px,10vw,104px) 24px',
        background: 'rgba(255,255,255,0.012)',
        borderTop:  `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <div style={{ ...container }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: 60, textAlign: 'center' }}
        >
          <p style={{ ...sectionLabel, textAlign: 'center' }}>Simple by design</p>
          <h2 style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 700,
            fontSize: 'clamp(28px, 4vw, 44px)',
            color: C.text, letterSpacing: '-0.5px',
          }}>
            How it works
          </h2>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 48,
        }}>
          {STEPS.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.14, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Number circle */}
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                border: `1.5px solid rgba(245,158,11,0.5)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 22,
                fontFamily: 'Syne, sans-serif', fontWeight: 700,
                fontSize: 15, color: C.primary,
              }}>
                {step.number}
              </div>

              <h3 style={{
                fontFamily: 'Syne, sans-serif', fontWeight: 700,
                fontSize: 19, color: C.text, marginBottom: 10,
              }}>
                {step.title}
              </h3>
              <p style={{
                color: C.muted, fontSize: 14.5,
                fontFamily: 'DM Sans, sans-serif',
                lineHeight: 1.7,
              }}>
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Trust Banner ──────────────────────────────────────────────────────────────
const PARTNERS = ['Solana', 'Dodo Payments', 'Umbra', 'Covalent', 'RPC Fast'];

function TrustBanner() {
  return (
    <section style={{ padding: 'clamp(56px,8vw,88px) 24px' }}>
      <div style={{ ...container, textAlign: 'center' }}>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{
            color: C.muted, fontSize: 15,
            fontFamily: 'DM Sans, sans-serif',
            maxWidth: 560, margin: '0 auto 40px',
            lineHeight: 1.65,
          }}
        >
          Built for India's 450 million unorganised workers.<br />
          Powered by the infrastructure they deserve.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 'clamp(24px,5vw,52px)', alignItems: 'center' }}
        >
          {PARTNERS.map((p, i) => (
            <motion.span
              key={p}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.4 }}
              style={{
                fontFamily: 'Syne, sans-serif', fontWeight: 600,
                fontSize: 14, letterSpacing: '0.04em',
                color: 'rgba(240,237,232,0.28)',
                cursor: 'default',
                transition: 'color 0.22s',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(240,237,232,0.72)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(240,237,232,0.28)')}
            >
              {p}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Footer ────────────────────────────────────────────────────────────────────
const FOOTER_LINKS = ['Docs', 'Privacy', 'Terms', 'GitHub'];

function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${C.border}`, padding: 'clamp(40px,6vw,60px) 24px 32px' }}>
      <div style={{ ...container }}>
        {/* Top row */}
        <div style={{
          display: 'flex', flexWrap: 'wrap',
          justifyContent: 'space-between', alignItems: 'flex-start',
          gap: 32, marginBottom: 44,
        }}>
          {/* Logo + tagline */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: C.text }}>
                KaamPay
              </span>
              <span className="pulse-dot" />
            </div>
            <p style={{
              color: C.muted, fontSize: 14,
              fontFamily: 'DM Sans, sans-serif',
              lineHeight: 1.6, maxWidth: 240,
            }}>
              Get paid today.<br />Not in 90 days.
            </p>
          </div>

          {/* Links */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28 }}>
            {FOOTER_LINKS.map(link => (
              <a
                key={link}
                href="#"
                style={{
                  color: C.muted, fontSize: 14,
                  fontFamily: 'DM Sans, sans-serif',
                  transition: 'color 0.18s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = C.text)}
                onMouseLeave={e => (e.currentTarget.style.color = C.muted)}
              >
                {link}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: `1px solid ${C.border}`,
          paddingTop: 24,
          display: 'flex', justifyContent: 'center',
        }}>
          <p style={{
            color: 'rgba(240,237,232,0.28)',
            fontSize: 13, fontFamily: 'DM Sans, sans-serif',
          }}>
            Built for Bharat. Powered by Solana. 2026.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Page Root ─────────────────────────────────────────────────────────────────
export default function Landing() {
  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text }}>
      <Navbar />
      <main>
        <Hero />
        <StatsBar />
        <FeaturesSection />
        <HowItWorks />
        <TrustBanner />
      </main>
      <Footer />
    </div>
  );
}
