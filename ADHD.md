# ⚡ DesksAI — ADHD.md
> *Last updated: 2026-04-30*

---

## 🧠 What Is This?
SaaS remake of Space Agent — a mobile-first, multi-tenant platform where AI agents build and reshape interactive widget desks at runtime.

---

## ✅ What It Does (Right Now)
- Email/password auth with NextAuth, workspace provisioning
- Desk CRUD, L0/L1/L2 resource layering and resolution
- OpenRouter streaming agent runtime with execution cards
- Prompt assembly with skills, memories, and prompt‑includes
- Basic glass‑theme UI, mobile‑first bottom navigation
- Docker Postgres, Drizzle ORM, TypeScript stack

---

## 🚀 What It Will Do
- [ ] Agent‑built UI canvas (widgets, sandboxed renderers)
- [ ] Time‑travel versioning and rollback
- [ ] ZIP sharing & encrypted hosted shares
- [ ] Telegram bot bridge with `/start` link flow
- [ ] In‑app browser widget (iframe + headless)
- [ ] Local LLM via Transformers.js Web Worker
- [ ] PWA + push notifications, admin agent, Stripe billing

---

## 🎯 What We Want
The agent is the product — not a chatbot beside it. Users prompt an AI to create, edit, and interact with live widget desks that persist, version, and can be shared. Multi‑tenant SaaS that still runs self‑hosted.

---

## 🏗️ How It's Built
| Layer | Tech |
|-------|------|
| Frontend | Next.js 16 App Router, Tailwind v4, shadcn/ui, React 19 |
| Backend | Node, Next API Routes, Drizzle ORM |
| DB | PostgreSQL (Neon prod, Docker local), SQLite (dev) |
| Auth | NextAuth credentials |
| Hosting | Vercel (SaaS), Docker compose (self‑host) |

---

## 🔧 Systems & Infra
- **Repo:** `github.com/mtldev-dotcom/DeskAI-Agent`
- **Port / URL:** `localhost:3001` (dev), `localhost:3000` (default)
- **Deploy:** `docker compose up -d postgres` + Vercel
- **Env:** `.env.local` — key vars: `DATABASE_URL`, `NEXTAUTH_SECRET`, `OPENROUTER_API_KEY`, `TELEGRAM_BOT_TOKEN`

---

## 💻 Code Patterns
- **Folder structure:** `app/(auth)`, `app/(app)`, `components/`, `lib/agent/`, `lib/db/`
- **State:** Server‑side RSC + client streaming; Zustand planned
- **API style:** REST (route handlers) + SSE streaming
- **Key conventions:** L0/L1/L2 resource layers, `runAgent` runtime, sandboxed iframe widgets

---

## 🔌 APIs & Integrations
| Service | What For | Key |
|---------|----------|-----|
| OpenRouter | AI generation | `OPENROUTER_API_KEY` |
| Telegram | chat bridge | `TELEGRAM_BOT_TOKEN` |
| Browserless | headless browsing | `BROWSERLESS_TOKEN` (optional) |
| Stripe | billing | `STRIPE_SECRET_KEY` (phase 5) |

---

## ⚠️ Watch Out
- Database defaults to host port `5433` to avoid conflicts
- `.env.local` is git‑ignored; copy `.env.example`
- Web push VAPID keys need generation (`npx web-push generate-vapid-keys`)
- Encryption master key must be set (`ENCRYPTION_MASTER_KEY`)

---

## 🗒️ Nick's Notes
> 2026‑04‑30 — ADHD.md generated fresh. Project is mid‑build: P1/P2 complete, P3 (agent‑built UI) pending. Reference docs/claude-plan.md for full spec.