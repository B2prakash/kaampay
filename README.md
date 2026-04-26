# KaamPay ⚡
### India's On-Chain Wage & Invoice Platform

[![Solana](https://img.shields.io/badge/Built%20on-Solana-9945FF?style=flat-square)](https://solana.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Live-brightgreen?style=flat-square)]()

> *"Get paid today. Not in 90 days."*

🌐 **Live Demo:** https://kaampay-dapp.netlify.app/

---

## 🇮🇳 Why KaamPay?

India has 450 million unorganized workers — construction laborers, 
farm hands, factory workers, daily wage earners — who face three 
devastating financial problems every single day.

**Problem 1 — Wage Theft**
Contractors routinely delay or steal wages. Workers have no payment 
proof, no financial identity, and no recourse. A worker in Delhi can 
work 30 days and never receive a single rupee.

**Problem 2 — Invoice Crisis**
India's 63 million SMEs have ₹10.7 lakh crore locked in unpaid 
invoices. A steel supplier waits 90 days to get paid. Meanwhile 
they cannot pay their own workers or buy raw materials.

**Problem 3 — Remittance Fees**
Workers sending money home lose 6.5% to banks and wire transfer 
services. On ₹10,000 sent home, ₹650 vanishes into fees meant 
for food, medicine, and education.

---

## ✅ What KaamPay Does

KaamPay is a full-stack Web3 platform built on Solana that solves 
all three problems using USDC stablecoins, smart escrow contracts, 
and privacy-preserving payments.

---

## 🏗️ Three Core Modules

### ⚡ InstaPay — Instant Wage Payments
Contractors register workers and set daily wages in USDC. One click 
pays all workers instantly via Dodo Payments API. Every payment is 
recorded permanently on Solana as proof. Transactions stay private 
via Umbra SDK — only contractor and worker can see details.

- Bank transfer: 2-3 days, ₹50 fee
- KaamPay: less than 1 second, $0.0005 fee

### 📄 InvoiceChain — B2B Invoice Settlement
SME suppliers create invoices on KaamPay. Buyer deposits USDC into 
Solana smart escrow — funds locked and guaranteed. When buyer 
confirms delivery, USDC releases to seller automatically. 
No waiting. No risk of non-payment.

- Traditional invoice: 60-90 day wait
- KaamPay escrow: 3 second settlement

### 🏠 HomeRemit — Family Remittance
Workers send USDC to family at just 0.1% fee. Money arrives in 
under 2 seconds. Family converts to INR via local exchanges.

| Method | Fee | Time |
|---|---|---|
| Bank Wire | 6.5% | 2-3 days |
| Western Union | 5% | 1 day |
| **KaamPay** | **0.1%** | **2 seconds** |

---

## 🤖 AI Assistant — Hindi + English

Built-in AI assistant powered by Google Gemini understands 
both Hindi and English naturally:

- "Mera balance kya hai?" → Shows USDC balance in INR
- "Last payment kab aya?" → Shows payment history
- "Paise ghar kaise bhejun?" → Guides through HomeRemit
- "USDC kya hai?" → Explains stablecoins simply

Makes the platform accessible to non-technical workers.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React + Vite + TypeScript | User interface |
| Styling | Tailwind CSS + Framer Motion | Design + animations |
| Blockchain | Solana Web3.js | On-chain transactions |
| Wallet | Phantom + Solflare | User wallet connection |
| Payments | Dodo Payments API | USDC payment processing |
| Privacy | Umbra SDK | Private wage transfers |
| Analytics | Covalent GoldRush | Transaction analytics |
| RPC | Helius | Solana RPC endpoint |
| AI | Google Gemini | Hindi/English assistant |
| Backend | Node.js + Express | REST API server |
| Database | SQLite via Prisma | Data persistence |
| Auth | Better Auth | Secure login system |

---

## 📊 Impact

| Metric | Before | After KaamPay |
|---|---|---|
| Wage payment time | 2-30 days | Less than 1 second |
| Invoice settlement | 60-90 days | 3 seconds |
| Remittance fee | 6.5% | 0.1% |
| Payment proof | Paper or none | Permanent on Solana |
| Workers who benefit | 0 | 450M potential |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Phantom Wallet browser extension

### Installation

```bash
git clone https://github.com/B2prakash/kaampay.git
cd kaampay

# Frontend
cd frontend
npm install
npm run dev

# Backend (new terminal)
cd backend
npm install
npm run dev
```

### Environment Variables
```bash
cp .env.example .env
```

Fill in:
```
DODO_PAYMENTS_API_KEY=      from dodopayments.com
COVALENT_API_KEY=           from goldrush.dev
VITE_GEMINI_API_KEY=        from aistudio.google.com
VITE_SOLANA_RPC_URL=        from helius.dev
DATABASE_URL=file:./dev.db
```

---

## 🗺️ Roadmap

**Done:**
- InstaPay wage payments
- InvoiceChain B2B escrow
- HomeRemit family transfers
- Hindi + English AI assistant
- Contractor and Worker dashboards
- Login and registration system
- Analytics dashboard
- Privacy via Umbra SDK

**Coming next:**
- Mobile app React Native
- Solana mainnet deployment
- UPI off-ramp integration
- Aadhaar-based worker verification
- WhatsApp payment notifications

---

## 👨‍💻 Builder

Vedprakash — 4th Year BE-IT, Chandigarh University  
GitHub: [@B2prakash](https://github.com/B2prakash)

---

## 📄 License

MIT License

---

Built with love for Bharat's 450 million workers. Powered by Solana.
