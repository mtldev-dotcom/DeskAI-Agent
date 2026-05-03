# DesksAI — ADHD.md
> *Last updated: 2026-05-03*

---

## 🧠 What Is This?
SaaS remake of Space Agent: a mobile-first, multi-tenant platform where users build interactive widget desks — manually from a picker or via AI agent at runtime.

---

## ✅ What It Does (Right Now)
- Email/password auth with NextAuth, workspace provisioning, role-based membership (owner/admin/member)
- English + French UI localization with `next-intl` (`/desks`, `/sign-in`, `/sign-up`, `/fr/...`)
- Desk CRUD with soft-delete; L0/L1/L2 resource layering and resolution
- **Widget Picker modal** — users browse and add prebuilt widgets without AI
- **10 builtin widget types:** markdown (notes), kanban, browser (iframe), code, chart, form, iframe, todo, richtext, whiteboard
- **Inline editing** — markdown (textarea), kanban (add/delete cards + column titles), code (textarea + language select)
- **Interactive widgets** — todo (checkbox toggle), richtext (TipTap WYSIWYG auto-save), whiteboard (tldraw v4)
- **Widget CRUD from UI** — add via picker (`POST /api/widgets`), delete with inline confirm, edit with pencil toggle
- `lib/widgets/defaults.ts` — single source of truth for widget type metadata, defaults, and layouts
- OpenRouter streaming agent runtime with multi-turn tool loops (up to 4 rounds)
- Prompt assembly with system skills, persistent/transient memories, history token-budgeting
- Agent tools: `desk.create/patch/list`, `widget.add/patch/remove/list`, `skill.write/list`, `memory.write/list`
- Agent `widget.add` supports all 10 types including `todo`, `richtext`, `whiteboard`
- Execution cards for every tool call; expandable with args/output
- Draggable/resizable widget canvas via `react-grid-layout` (12-col grid)
- Sandboxed iframe renderers (`sandbox="allow-scripts"`) with postMessage bridge (`window.DesksAI`)
- Full version history on every resource mutation; rollback API (append-only)
- Desk export/import as portable JSON

---

## 🔜 What It Will Do
- [x] Agent-built UI canvas (widgets, sandboxed renderers)
- [x] Time-travel versioning and rollback
- [x] Desk export/import (portable JSON)
- [x] Prebuilt widget picker (V1 — user-direct widget creation)
- [x] Interactive / inline-editable widgets (markdown, kanban, code, todo, richtext, whiteboard)
- [ ] ZIP bundle + encrypted hosted shares
- [ ] Telegram bot bridge with `/start` link flow
- [ ] In-app browser widget (iframe + headless Browserless backend)
- [ ] Local LLM via Transformers.js Web Worker
- [ ] PWA + push notifications + admin agent route
- [ ] Stripe billing, tier limits, member invites, audit log UI

---

## 🎯 What We Want
The agent is the product enhancement, not a chatbot beside it. V1 lets users build directly from a widget picker; AI agent handles automation, custom widgets, and complex flows. Multi-tenant SaaS that still runs self-hosted.

---

## 🏗 How It's Built
| Layer | Tech |
|-------|------|
| Frontend | Next.js 16.2 App Router, React 19, Tailwind v4, shadcn/base-ui |
| Canvas | react-grid-layout (drag/resize), sandboxed iframes |
| Widgets | tldraw v4 (whiteboard), TipTap v3 (richtext), custom React (todo) |
| Backend | Node, Next Route Handlers, Drizzle ORM 0.41 |
| DB | PostgreSQL 16 (Neon prod, Docker local port 5433) |
| Auth | NextAuth 4 credentials + custom signup |
| Agent | OpenRouter (default: `anthropic/claude-sonnet-4-6`) |
| i18n | `next-intl` with `en` default and `/fr` prefix |
| Versioning | fast-json-patch diffs, append-only resource_versions table |
| Hosting | Vercel (SaaS), Docker Compose (self-host) |

---

## ⚙️ Systems & Infra
- **Repo:** `github.com/mtldev-dotcom/DeskAI-Agent`
- **Port / URL:** `localhost:3001` (dev convention), `localhost:3000` (Next default)
- **Deploy:** `docker compose up -d postgres` + Vercel
- **Env:** `.env.local` - key vars: `DATABASE_URL`, `NEXTAUTH_SECRET`, `OPENROUTER_API_KEY`, `TELEGRAM_BOT_TOKEN`, `ENCRYPTION_MASTER_KEY`

---

## 🧩 Code Patterns
- **Widget registry:** `lib/widgets/defaults.ts` — `WIDGET_DEFINITIONS[]` with type, label, category, defaultProps, defaultLayout
- **Widget creation:** `POST /api/widgets` (user) or `widget.add` tool (agent) — both write `widgetInstances` + update `resources.content.widgetIds`
- **Folder structure:** `app/[locale]/(auth)`, `app/[locale]/(app)`, `components/canvas`, `components/widgets/builtin`, `lib/agent/`, `lib/db/`, `lib/widgets/`, `lib/sharing/`, `i18n/`, `messages/`
- **Agent tools:** one file per surface in `lib/agent/tools/` - all write version rows on mutation
- **Layer system:** L0 (seed firmware) < L1 (workspace default) < L2 (user override) - resolved via `lib/db/layers.ts`
- **API style:** REST route handlers + SSE streaming (`text/event-stream`)
- **State:** Server RSC + client streaming; canvas widget state owned locally in `DeskCanvas`
- **Security:** all DB queries filtered by `workspace_id` from session; libsodium seal for API keys

---

## 🔌 APIs & Integrations
| Service | What For | Key |
|---------|----------|-----|
| OpenRouter | AI generation | `OPENROUTER_API_KEY` |
| Telegram | Chat bridge (P5 - not yet wired) | `TELEGRAM_BOT_TOKEN` |
| Browserless | Headless browsing (P6 - stub only) | `BROWSERLESS_TOKEN` |
| Stripe | Billing (P8 - schema only) | `STRIPE_SECRET_KEY` |
| web-push | Push notifications (P7 - schema only) | VAPID keys |

---

## ⚠️ Watch Out
- Database host port is `5433` (not 5432) to avoid conflicts - check `DATABASE_URL`
- `.env.local` is git-ignored; copy `.env.example` and fill all vars before running
- Web push VAPID keys need generation: `npx web-push generate-vapid-keys`
- `ENCRYPTION_MASTER_KEY` must be set for libsodium API key storage
- Browser tool (`lib/agent/tools/browser.ts`) is a stub - returns "not yet implemented" until P6
- `pnpm build` shows a `middleware` to `proxy` deprecation warning in Next.js 16; build is otherwise clean
- Rollback is append-only - it creates a new version row rather than mutating history
- tldraw CSS must be imported in Whiteboard.tsx: `import "@tldraw/tldraw/tldraw.css"`
- RichText (TipTap) auto-saves after 1500ms debounce; Whiteboard (tldraw) auto-saves after 2000ms on `scope: "document"` changes only
- CRM Pipeline is a `kanban` widget preset, not a distinct type — picker creates kanban with 5 preset columns
- `pnpm db:seed` must be re-run after any new L0 widget definitions to register `todo`, `richtext`, `whiteboard` in DB

---

## 📝 Nick's Notes
> 2026-05-01 — P4 (time travel + sharing) is complete, and English/French UI localization is now in place. Next likely follow-up: migrate `middleware.ts` to `proxy.ts`, then move to P5 (Telegram integration).
> 2026-05-03 — V1 Foundation (P-Widget) is complete: prebuilt widget picker, 3 new widget types (todo, richtext, whiteboard), inline editing for markdown/kanban/code. Build clean, tsc clean. P5 (Telegram) is next.
