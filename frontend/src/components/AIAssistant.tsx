/**
 * KaamPay AI Assistant — Powered by Google Gemini
 * Streaming chat with Hindi/English support.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, ChevronRight, Copy, Check } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useWalletConnection, useUSDCBalance } from '../hooks/useSolana';

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  bg:      '#060B14',
  surface: '#0E1420',
  primary: '#F59E0B',
  text:    '#F0EDE8',
  muted:   'rgba(240,237,232,0.5)',
  muted2:  'rgba(240,237,232,0.22)',
  border:  'rgba(255,255,255,0.08)',
  border2: 'rgba(255,255,255,0.05)',
  green:   '#34D399',
} as const;

const FD   = 'DM Sans, sans-serif';
const FS   = 'Syne, sans-serif';
const EASE = [0.16, 1, 0.3, 1] as const;

// ── Gemini setup ───────────────────────────────────────────────────────────────
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

const SYSTEM_INSTRUCTION = `You are KaamPay's helpful assistant for Indian daily wage workers and contractors.
You understand Hindi and English naturally. Help users with:
- Payment status and balance queries
- Sending money to family via HomeRemit
- Understanding USDC and Solana blockchain
- Invoice and escrow questions
- Daily wage payment queries
Always be warm, simple and clear.
Use Hindi naturally when user writes in Hindi.
Keep responses short — max 3 sentences.
Start responses with "Namaste!" when greeting.`;

// ── Mock fallback ──────────────────────────────────────────────────────────────
const MOCK_MAP: { test: (s: string) => boolean; reply: string }[] = [
  { test: s => /balance|kitna/.test(s),               reply: 'Aapka balance 45 USDC hai (₹3,750)! 💰' },
  { test: s => /payment|paisa|aya|mila/.test(s),      reply: 'Last payment aaj 6:00 PM ko aya — 6 USDC from Rajesh Contractors ✅' },
  { test: s => /ghar|family|send|remit/.test(s),      reply: 'HomeRemit use karein! Sirf 0.001 USDC fee mein ghar paise bhejein 🏠' },
  { test: s => /week|hafte|kama/.test(s),             reply: 'Is hafte 36 USDC kamaya — 6 din kaam karke! 💪' },
  { test: s => /usdc|crypto|coin/.test(s),            reply: '1 USDC = 1 USD = ₹83. Solana pe instantly transfer hota hai! ⚡' },
  { test: s => /invoice|escrow/.test(s),              reply: 'Invoice escrow mein safe hai. Delivery confirm hone pe release hoga 📄' },
];

function getMockResponse(message: string): string {
  const lower = message.toLowerCase();
  const match = MOCK_MAP.find(m => m.test(lower));
  return match?.reply ?? 'Kya aap dobara pooch sakte hain? Hindi ya English mein likhein! 🙏';
}

async function askGemini(
  userMessage: string,
  history: { role: string; content: string }[],
  walletAddress: string | null,
  balance: number,
): Promise<string> {
  if (!GEMINI_KEY) return getMockResponse(userMessage);

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: `${SYSTEM_INSTRUCTION}\nCurrent user: wallet ${walletAddress ? walletAddress.slice(0, 8) + '…' : 'not connected'}, balance ${balance.toFixed(2)} USDC.`,
    });

    const chat = model.startChat({
      history: history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })),
    });

    const result = await chat.sendMessage(userMessage);
    return result.response.text();
  } catch {
    return getMockResponse(userMessage);
  }
}

// ── Types ──────────────────────────────────────────────────────────────────────
interface Msg {
  id: string;
  role: 'ai' | 'user';
  text: string;
  ts: Date;
  loading?: boolean;
}

const QUICK_REPLIES = [
  { label: 'Mera balance kya hai?',    query: 'Namaste, mera balance kya hai?' },
  { label: 'Last payment kab aya?',    query: 'Last payment kab aya?' },
  { label: 'Paise ghar kaise bhejun?', query: 'Paise ghar kaise bhejun?' },
  { label: 'What is USDC?',            query: 'What is USDC?' },
  { label: 'How does Solana work?',    query: 'How does Solana work simply?' },
  { label: 'Aaj kitna kama?',          query: 'Aaj kitna kama?' },
];

function uid() { return Math.random().toString(36).slice(2); }

// ── Copy button ────────────────────────────────────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: copied ? C.green : C.muted2,
        display: 'flex', alignItems: 'center', gap: 3,
        fontFamily: FD, fontSize: 10,
        transition: 'color 0.15s', padding: '2px 4px',
      }}
    >
      {copied ? <Check size={10} /> : <Copy size={10} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

// ── Typing indicator ───────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 5, height: 5, borderRadius: '50%',
          background: C.muted, display: 'inline-block',
          animation: `kpBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
      <style>{`@keyframes kpBounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-4px)}}`}</style>
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function AIAssistant({ workerName = 'User' }: { workerName?: string }) {
  const { publicKey } = useWalletConnection();
  const walletAddress = publicKey?.toBase58() ?? null;
  const { balance }   = useUSDCBalance(walletAddress);

  const [open, setOpen]       = useState(false);
  const [msgs, setMsgs]       = useState<Msg[]>([{
    id: uid(), role: 'ai', ts: new Date(),
    text: `Namaste ${workerName}! 🙏 Main KaamPay ka assistant hoon.\n\nHindi ya English mein kuch bhi poochh sakte ho — payments, balance, ghar paise bhejne ke baare mein.`,
  }]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef             = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Msg = { id: uid(), role: 'user', text: text.trim(), ts: new Date() };
    const aiId = uid();

    setMsgs(prev => [...prev, userMsg, { id: aiId, role: 'ai', text: '', ts: new Date(), loading: true }]);
    setInput('');
    setLoading(true);

    // Build history (last 10, exclude loading placeholders)
    const history = msgs
      .filter(m => !m.loading && m.text)
      .slice(-10)
      .map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text }));

    const reply = await askGemini(text.trim(), history, walletAddress, balance);

    setMsgs(prev => prev.map(m =>
      m.id === aiId ? { ...m, loading: false, text: reply } : m
    ));
    setLoading(false);
  }, [msgs, loading, walletAddress, balance]);

  return (
    <>
      {/* Floating trigger */}
      <motion.button
        onClick={() => setOpen(v => !v)}
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: 'fixed', bottom: 32, right: 32, zIndex: 300,
          width: 56, height: 56, borderRadius: '50%',
          background: open ? C.surface : C.primary,
          border: open ? `1px solid ${C.border}` : 'none',
          cursor: 'pointer',
          color: open ? C.text : '#060B14',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: open ? 'none' : '0 8px 28px rgba(245,158,11,0.38)',
          transition: 'background 0.2s, box-shadow 0.2s, color 0.2s',
        }}
        aria-label="Open KaamPay AI assistant"
      >
        {open ? <X size={20} /> : <MessageCircle size={22} />}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="ai-panel"
            initial={{ opacity: 0, x: 28, y: 8 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 28, y: 8 }}
            transition={{ duration: 0.26, ease: EASE }}
            style={{
              position: 'fixed', right: 100, bottom: 24, zIndex: 299,
              width: 400, height: 520,
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 18,
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 24px 56px rgba(0,0,0,0.55)',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${C.border2}`,
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'rgba(245,158,11,0.03)',
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'rgba(245,158,11,0.14)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <MessageCircle size={18} style={{ color: C.primary }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: FS, fontWeight: 700, fontSize: 14, color: C.text }}>
                  KaamPay Assistant
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: GEMINI_KEY ? C.green : '#F87171', display: 'inline-block' }} />
                  <p style={{ fontFamily: FD, fontSize: 11, color: C.muted2 }}>
                    {GEMINI_KEY ? 'Gemini · Hindi · English · Online' : 'Demo mode — no API key'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.05)', border: 'none',
                  borderRadius: 7, padding: 6, cursor: 'pointer', color: C.muted,
                  display: 'flex', transition: 'background 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = C.text; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = C.muted; }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1, overflowY: 'auto', padding: '16px 16px 8px',
              display: 'flex', flexDirection: 'column', gap: 14,
            }}>
              {msgs.map(msg => (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '86%', padding: '10px 14px',
                    background: msg.role === 'user'
                      ? 'rgba(245,158,11,0.13)'
                      : 'rgba(255,255,255,0.04)',
                    border: msg.role === 'user'
                      ? '1px solid rgba(245,158,11,0.22)'
                      : `1px solid ${C.border2}`,
                    fontFamily: FD, fontSize: 13,
                    color: msg.role === 'user' ? C.primary : C.text,
                    lineHeight: 1.6, whiteSpace: 'pre-wrap',
                    borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                  }}>
                    {msg.loading ? <TypingDots /> : msg.text}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, opacity: 0.6 }}>
                    <span style={{ fontFamily: FD, fontSize: 10, color: C.muted2 }}>
                      {msg.ts.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.role === 'ai' && !msg.loading && msg.text && (
                      <CopyBtn text={msg.text} />
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Quick replies */}
            <div style={{
              padding: '8px 12px',
              borderTop: `1px solid ${C.border2}`,
              display: 'flex', flexWrap: 'wrap', gap: 5,
            }}>
              {QUICK_REPLIES.map(qr => (
                <button
                  key={qr.label}
                  onClick={() => sendMessage(qr.query)}
                  disabled={loading}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${C.border}`,
                    color: C.muted, padding: '4px 10px', borderRadius: 100,
                    fontSize: 11, fontFamily: FD,
                    cursor: loading ? 'default' : 'pointer',
                    transition: 'background 0.15s, color 0.15s',
                    opacity: loading ? 0.5 : 1,
                  }}
                  onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = 'rgba(245,158,11,0.09)'; e.currentTarget.style.color = C.primary; } }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = C.muted; }}
                >
                  {qr.label}
                </button>
              ))}
            </div>

            {/* Input */}
            <div style={{
              padding: '10px 12px',
              borderTop: `1px solid ${C.border2}`,
              display: 'flex', gap: 8, alignItems: 'center',
            }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                placeholder="Ask in Hindi or English…"
                disabled={loading}
                style={{
                  flex: 1, padding: '9px 12px',
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${C.border}`,
                  borderRadius: 9, color: C.text,
                  fontFamily: FD, fontSize: 13, outline: 'none',
                  transition: 'border-color 0.18s',
                  opacity: loading ? 0.7 : 1,
                }}
                onFocus={e => (e.target.style.borderColor = 'rgba(245,158,11,0.4)')}
                onBlur={e => (e.target.style.borderColor = C.border)}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                style={{
                  width: 36, height: 36, borderRadius: 9,
                  background: (loading || !input.trim()) ? 'rgba(245,158,11,0.4)' : C.primary,
                  border: 'none',
                  color: '#060B14',
                  cursor: (loading || !input.trim()) ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'opacity 0.15s, background 0.15s', flexShrink: 0,
                }}
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
