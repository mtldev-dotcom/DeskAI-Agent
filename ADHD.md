# DesksAI - ADHD.md
> Last updated: 2026-05-01

---

## What Is This?
SaaS remake of Space Agent: a mobile-first, multi-tenant platform where AI agents build and reshape interactive widget desks at runtime.

---

## What It Does (Right Now)
- Email/password auth with NextAuth, workspace provisioning, role-based membership (owner/admin/member)
- English + French UI localization with `next-intl` (`/desks`, `/sign-in`, `/sign-up`, `/fr/...`)
- Desk CRUD with soft-delete; L0/L1/L2 resource layering and resolution
- OpenRouter streaming agent runtime with multi-turn tool loops (up to 4 rounds)
- Prompt assembly with system skills, persistent/transient memories, history token-budgeting
- Agent tools: `desk.create/patch/list`, `widget.add/patch/remove/list`, `skill.write/list`, `memory.write/list`
- Execution cards for every tool call; expandable in UI with args/output
- Draggable/resizable widget canvas via `react-grid-layout`
- Builtin widgets: markdown, kanban, browser (iframe), code, chart, form, custom iframe
- Sandboxed iframe renderers (`sandbox="allow-scripts"`) with postMessage bridge
- Full version history on every resource mutation (desk, widget, skill, memory)
- Automatic JSON diff calculation between consecutive versions (`fast-json-patch`)
- Rollback API (append-only, transactionally safe)
- `VersionList` UI component for browsing version history
- Desk export/import as portable JSON (transactional, idempotent skill import)
- Glass dark theme, animated orb backdrop, mobile-first bottom nav

---

## What It Will Do
- [x] Agent-built UI canvas (widgets, sandboxed renderers)
- [x] Time-travel versioning and rollback
- [x] Desk export/import (portable JSON)
- [ ] ZIP bundle + encrypted hosted shares
- [ ] Telegram bot bridge with `/start` link flow
- [ ] In-app browser widget (iframe + headless Browserless backend)
- [ ] Local LLM via Transformers.js Web Worker
- [ ] PWA + push notifications + admin agent route
- [ ] Stripe billing, tier limits, member invites, audit log UI

---

## What We Want
The agent is the product, not a chatbot beside it. Users prompt an AI to create, edit, and interact with live widget desks that persist, version, and can be shared. Multi-tenant SaaS that still runs self-hosted.

---

## How It's Built
| Layer | Tech |
|-------|------|
| Frontend | Next.js 16.2 App Router, React 19, Tailwind v4, shadcn/base-ui |
| Canvas | react-grid-layout (drag/resize), sandboxed iframes |
| Backend | Node, Next Route Handlers, Drizzle ORM 0.41 |
| DB | PostgreSQL 16 (Neon prod, Docker local port 5433) |
| Auth | NextAuth 4 credentials + custom signup |
| Agent | OpenRouter (default: `anthropic/claude-sonnet-4-6`) |
| i18n | `next-intl` with `en` default and `/fr` prefix |
| Versioning | fast-json-patch diffs, append-only resource_versions table |
| Hosting | Vercel (SaaS), Docker Compose (self-host) |

---

## Systems & Infra
- **Repo:** `github.com/mtldev-dotcom/DeskAI-Agent`
- **Port / URL:** `localhost:3001` (dev convention), `localhost:3000` (Next default)
- **Deploy:** `docker compose up -d postgres` + Vercel
- **Env:** `.env.local` - key vars: `DATABASE_URL`, `NEXTAUTH_SECRET`, `OPENROUTER_API_KEY`, `TELEGRAM_BOT_TOKEN`, `ENCRYPTION_MASTER_KEY`

---

## Code Patterns
- **Folder structure:** `app/[locale]/(auth)`, `app/[locale]/(app)`, `components/canvas`, `components/widgets/builtin`, `lib/agent/`, `lib/db/`, `lib/sharing/`, `i18n/`, `messages/`
- **Agent tools:** one file per surface in `lib/agent/tools/` - all write version rows on mutation
- **Layer system:** L0 (seed firmware) < L1 (workspace default) < L2 (user override) - resolved via `lib/db/layers.ts`
- **API style:** REST route handlers + SSE streaming (`text/event-stream`)
- **State:** Server RSC + client streaming; canvas state via react-grid-layout
- **Security:** all DB queries filtered by `workspace_id` from session; libsodium seal for API keys

---

## APIs & Integrations
| Service | What For | Key |
|---------|----------|-----|
| OpenRouter | AI generation | `OPENROUTER_API_KEY` |
| Telegram | Chat bridge (P5 - not yet wired) | `TELEGRAM_BOT_TOKEN` |
| Browserless | Headless browsing (P6 - stub only) | `BROWSERLESS_TOKEN` |
| Stripe | Billing (P8 - schema only) | `STRIPE_SECRET_KEY` |
| web-push | Push notifications (P7 - schema only) | VAPID keys |

---

## Watch Out
- Database host port is `5433` (not 5432) to avoid conflicts - check `DATABASE_URL`
- `.env.local` is git-ignored; copy `.env.example` and fill all vars before running
- Web push VAPID keys need generation: `npx web-push generate-vapid-keys`
- `ENCRYPTION_MASTER_KEY` must be set for libsodium API key storage
- Browser tool (`lib/agent/tools/browser.ts`) is a stub - returns "not yet implemented" until P6
- `pnpm build` shows a `middleware` to `proxy` deprecation warning in Next.js 16; build is otherwise clean
- Rollback is append-only - it creates a new version row rather than mutating history

---

## Nick's Notes
> 2026-05-01 - P4 (time travel + sharing) is complete, and English/French UI localization is now in place. Next likely follow-up: migrate `middleware.ts` to `proxy.ts`, then move to P5 (Telegram integration).
