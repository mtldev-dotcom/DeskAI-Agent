# DesksAI — Agent Workflow & Repo Rules

## Mandatory first-read

Before writing a single line of code, every agent session MUST:

1. Read `docs/claude-plan.md` in full — the canonical plan, schema, and architecture
2. Read `docs/progress-report.md` — current phase completion status
3. Read `docs/handoff.md` — latest handoff state (what was done last session, what's next)
4. Do a quick `ls` audit of the repo root and changed directories
5. Plan the iteration BEFORE touching files; identify the smallest safe change
6. After every phase completes: update `docs/progress-report.md` AND `docs/handoff.md`

Rule: **If it's not documented, it's not complete.**

---

## Stack reference

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router), TypeScript strict |
| Styling | Tailwind v4 + `@base-ui/react` (shadcn primitives) |
| ORM | Drizzle ORM |
| DB | Postgres (Neon prod, Docker local) |
| Auth | NextAuth credentials + Postgres users |
| LLM | OpenRouter — default `anthropic/claude-sonnet-4-6` |
| Package manager | pnpm |
| Runtime env | Node 20+ |

---

## Phases

| Phase | Scope | Status |
|---|---|---|
| P1 | Foundation: NextAuth + Drizzle + workspaces + L0/L1/L2 + onboarding + Desks CRUD + glass shell | ⬜ pending |
| P2 | Chat runtime: OpenRouter streaming + runAgent + prompt-builder + skills + memory + execution cards | ✅ complete |
| P3 | Agent-built UI: widget canvas + builtin widgets + sandboxed iframe + agent tools | ⬜ pending |
| P4 | Time travel + sharing: resource_versions + diff/rollback + ZIP bundle + encrypted shares | ⬜ pending |
| P5 | Telegram: webhook + link flow + streaming edits + slash commands | ⬜ pending |
| P6 | Browser + local LLM: BrowserWidget + headless Browserless + Transformers.js Web Worker | ⬜ pending |
| P7 | PWA + push + admin agent: manifest + SW + web-push + Admin Agent route | ⬜ pending |
| P8 | Billing + polish: Stripe + tier limits + member invites + audit log | ⬜ pending |

Update this table as each phase lands.

---

## Directory rules

- **All domain types** live in `lib/db/schema.ts` (Drizzle) and/or `lib/types.ts`
- **All agent tool handlers** live in `lib/agent/tools/` — one file per surface (desk, widget, skill, memory, browser, code-exec)
- **All API routes** are route handlers (`route.ts`), not server actions
- **Streaming** uses `ReadableStream` / `text/event-stream` — never `res.write`
- **Client components** are minimal; keep RSC everywhere possible; push interactivity to leaf nodes
- **No barrel `index.ts`** re-exports unless the directory has 5+ files all consumed together
- **Migrations** live in `drizzle/` — never edit applied migrations; always create new ones

## Code standards

- TypeScript strict mode — no `any`, no `as unknown as X` escape hatches
- No comments unless the WHY is non-obvious (hidden constraint, subtle invariant, known upstream bug)
- Tailwind class order: layout → spacing → color/bg → border → typography → effects
- Mobile-first: all breakpoints use `md:` prefix for desktop enhancement, not mobile override
- Touch targets ≥ 44px; no hover-only affordances; `viewport-fit=cover` on root layout
- Glass dark theme: `backdrop-blur`, `border-white/10`, `bg-white/5` tokens — do not hardcode colors
- Execution cards for every agent tool call — never drop tool output silently

## Security rules

- Never commit API keys or `.env.local` values
- All DB queries filtered by `workspace_id` from the NextAuth session user — no cross-tenant leaks
- Sandboxed iframe renderers: `sandbox="allow-scripts"` only, postMessage API surface is minimal
- libsodium seal for API key storage — never store provider keys in plaintext
- Sanitize all LLM-generated URLs via `rehype-sanitize` before rendering

## Git workflow

- Commit message: `phase(P#): short description` — e.g., `feat(P1): Drizzle schema + migrations`
- One commit per phase minimum; more fine-grained is fine
- Never force-push; never amend published commits
- Keep `main` deployable at all times

## Local dev setup

```bash
docker compose up -d          # Postgres on :5433 by default
cp .env.example .env.local    # fill NEXTAUTH_*, OPENROUTER_API_KEY, DATABASE_URL
pnpm install
pnpm db:migrate               # applies all Drizzle migrations
pnpm db:seed                  # L0 firmware: skills, widget defs, onboarding template
pnpm dev                      # Next.js on :3000
```

Telegram webhook (optional):
```bash
ngrok http 3000
pnpm tg:set-webhook           # registers ngrok URL with Telegram
```

## Progress documentation contract

After every phase:
1. Mark phase ✅ in the table above AND in `docs/progress-report.md`
2. Add a section to `docs/progress-report.md` — what was built, key decisions, anything deferred
3. Overwrite `docs/handoff.md` with: what was done this session, current state, exact next steps for next agent session
