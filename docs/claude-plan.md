# DesksAI Agent — Full-feature SaaS Remake of Space Agent

## Context

Build a new standalone SaaS at `d:\DEV-D\desksAI\` that delivers **every Space Agent feature** on a modern, mobile-first, multi-tenant substrate, plus a Telegram chat bridge. Reference implementation lives at `docs/space-agent/` (browser-first vanilla JS, Alpine, Node HTTP, file-backed L0/L1/L2 customware, Electron). We keep the **product model** (agent-built widget canvas, layered customization, skills, time-travel, sharing, in-app browser, local LLM, admin agent) and replace the **substrate** with Next.js 16 + Postgres + NextAuth so it scales as a hosted SaaS. "Spaces" become **Desks** everywhere.

The non-negotiable: **the agent can reshape Desks at runtime** — create desks, add widgets, edit YAML/JSX renderers, run sandboxed JS in the frontend, browse the web, all with rollback. This is the product, not a chatbot beside it.

## Confirmed decisions

- Greenfield Next.js 16 (App Router), TypeScript, Tailwind v4, shadcn/ui (`@base-ui/react`), Drizzle ORM, Postgres (Neon prod, Docker local), NextAuth credentials auth, OpenRouter LLM (default `anthropic/claude-sonnet-4.6`), one shared Telegram bot with `/start <token>` link flow, mobile-first PWA.

## Feature parity matrix (Space Agent → DesksAI)

| Space Agent | DesksAI implementation |
|---|---|
| Spaces + widgets canvas | **Desks** with `react-grid-layout` canvas; widgets stored as jsonb (`type`, `props`, `layout`, optional `renderer`/`script`); renderer registry for built-in types + sandboxed iframe for agent-generated custom widgets |
| Onscreen agent overlay | `AgentOverlay` (Base UI Dialog, bottom-sheet on mobile, side panel ≥ md) |
| Admin agent | Separate `/admin/agent` route, admin-only role, broader tool surface (workspace mgmt, user mgmt, raw SQL helper) |
| Skill system (`SKILL.md`) | `skills` table + `lib/agent/skills-loader.ts` parses frontmatter (`when`, `loaded`, `placement`); auto-injects per-context |
| Prompt-include system | `prompt_includes` rows (`*.system.include.md`, `*.transient.include.md`); merged in `prompt-builder.ts` |
| Memory (persistent + transient) | `memories` table, `kind` enum, transient decay job |
| L0/L1/L2 customware | `resources` table with `layer` enum (`L0=firmware, L1=workspace, L2=user`); resolver merges low→high at read time; only L1/L2 writable |
| Git-backed time travel | `resource_versions` append-only table with jsonb diff + rollback API; covers desks, widgets, skills, prompt-includes, memories |
| Hosted space sharing | `shares` table; server bundles desk + widgets + assets into ZIP via `jszip`; Web Crypto AES-GCM for encrypted archives; public clone URL |
| Import/export ZIP | Same pipeline; export = download, import = upload + parse + write to L2 |
| In-app browsing | `BrowserWidget`: iframe-first with `sandbox` + postMessage bridge; agent commands `navigate/click/type/scroll/extract`; optional headless backend via Browserless API for sites that block iframes |
| Local LLM (Transformers.js / WebGPU) | `lib/agent/local-llm.ts` using `@huggingface/transformers` in a Web Worker; user picks model per conversation; falls back to OpenRouter |
| Onboarding space | On workspace create, seed default Desk from template (welcome widgets, getting-started skill) |
| Execution cards | Message `content` jsonb supports `{type:'tool_call', name, args, status, output}`; rendered as terminal-style card with live output |
| Streaming UI | In-place markdown patch (don't rebuild DOM per token); sticky scroll; URL sanitization via `rehype-sanitize` |
| Glass dark theme | Tailwind theme tokens for glass surfaces (backdrop-blur, border-white/10); subtle animated canvas backdrop component |
| Desktop app | Replaced by **PWA** (installable, push notifications); Electron deferred to post-launch |
| Self-hosted server | Replaced by **multi-tenant SaaS**; single self-host path remains via `docker compose up` |
| **NEW** Telegram channel | Shared bot, `/start <token>` link, same `runAgent` runtime, streaming via `editMessageText` |
| **NEW** Mobile-first | Bottom nav, swipe gestures, full-screen chat, safe-area insets, touch-sized targets |

## Architecture

### Directory layout

```
d:\DEV-D\desksAI\
  app\
    (auth)\sign-in\[[...rest]]\page.tsx
    (auth)\sign-up\[[...rest]]\page.tsx
    (app)\layout.tsx                       # bottom-tab shell, workspace ctx
    (app)\desks\page.tsx                   # desk list
    (app)\desks\[id]\page.tsx              # canvas + chat overlay
    (app)\desks\[id]\edit\page.tsx
    (app)\skills\page.tsx, [id]\page.tsx
    (app)\memories\page.tsx
    (app)\prompt-includes\page.tsx
    (app)\history\page.tsx                 # time-travel browser
    (app)\share\[token]\page.tsx           # public hosted share
    (app)\settings\{telegram,api-keys,workspace,members,billing}\page.tsx
    (admin)\layout.tsx, agent\page.tsx, users\page.tsx, workspaces\page.tsx
    api\
      chat\stream\route.ts                 # SSE; web + admin
      tools\execute\route.ts               # sandboxed agent JS exec proxy
      desks\route.ts, [id]\route.ts
      widgets\route.ts, [id]\route.ts
      skills\..., memories\..., prompt-includes\...
      resources\[id]\versions\route.ts     # time travel
      resources\[id]\rollback\route.ts
      shares\route.ts, [token]\route.ts, [token]\clone\route.ts
      browser\command\route.ts             # headless browser proxy
      telegram\webhook\route.ts, link\route.ts
      workspaces\route.ts, [id]\members\route.ts
      stripe\webhook\route.ts
      health\route.ts
  components\
    canvas\DeskCanvas.tsx, WidgetFrame.tsx, WidgetRenderer.tsx
    widgets\builtin\{Markdown,Kanban,Browser,Code,Chart,Form,Iframe}.tsx
    chat\ChatStream.tsx, MessageBubble.tsx, ExecutionCard.tsx, MarkdownPatcher.tsx
    agent\AgentOverlay.tsx, AdminAgent.tsx
    desk\DeskCard.tsx, DeskHeader.tsx
    history\VersionList.tsx, DiffView.tsx
    share\ShareDialog.tsx, ImportDialog.tsx
    mobile\BottomNav.tsx, BottomSheet.tsx, SwipeDrawer.tsx
    visual\GlassSurface.tsx, AnimatedBackdrop.tsx
    ui\                                    # shadcn primitives
  lib\
    agent\runtime.ts, prompt-builder.ts, skills-loader.ts,
          memory-store.ts, conversation-store.ts,
          openrouter-client.ts, local-llm.ts,
          tools\{desk,widget,skill,memory,browser,code-exec}.ts
    sandbox\worker.ts, iframe-bridge.ts    # JS execution sandbox
    browser\headless-client.ts             # Browserless proxy
    db\schema.ts, client.ts, queries.ts, layers.ts
    telegram\webhook.ts, link.ts, send.ts, commands.ts
    auth\workspace.ts, roles.ts
    crypto\seal.ts, share-encrypt.ts       # libsodium + Web Crypto
    sse\stream.ts
    sharing\zip-bundle.ts                  # jszip pack/unpack
    billing\limits.ts, stripe.ts
  drizzle\
  scripts\migrate.ts, seed.ts, set-telegram-webhook.ts, seed-onboarding-template.ts
  public\manifest.json, sw.js, icons\
    middleware.ts                            # NextAuth + workspace + admin gate
```

### Database schema (Drizzle / Postgres)

- `users` — `id`, `email` unique, `password_hash`, `default_workspace_id`, `default_desk_id`, `telegram_chat_id` bigint unique null, `is_global_admin` bool
- `workspaces` — `id`, `slug` unique, `name`, `owner_id`, `plan`, `stripe_customer_id`
- `workspace_members` — pk `(workspace_id, user_id)`, `role` enum `owner|admin|member`
- **`resources`** — unified table for all layered/versioned content: `id`, `workspace_id` null-for-L0, `user_id` null-unless-L2, `layer` enum `L0|L1|L2`, `kind` enum `desk|widget|skill|prompt_include|memory|onboarding_template`, `name`, `content` jsonb, `metadata` jsonb (frontmatter for skills/includes), `enabled` bool, `created_at`, `updated_at`, `archived_at`. Indexed `(workspace_id, layer, kind)`.
- `resource_versions` — append-only: `id`, `resource_id`, `content` jsonb, `diff` jsonb, `author_id`, `created_at`, `note`
- `desks` — view/specialization over `resources` where `kind='desk'`; `content` shape `{layout: GridLayout[], widgetIds: string[], systemPrompt, model}`
- `widget_instances` — `id`, `desk_id`, `resource_id` (the widget definition), `props` jsonb, `layout` jsonb (`{x,y,w,h,minimized}`)
- `conversations` — `id`, `desk_id`, `user_id`, `channel` enum `web|telegram|admin`, `title`
- `messages` — `id`, `conversation_id`, `role`, `content` jsonb (text + tool_calls + execution outputs), `tokens`, `created_at`; index `(conversation_id, created_at)`
- `tool_calls` — `id`, `message_id`, `name`, `args` jsonb, `status` enum `pending|running|done|error`, `output` jsonb, `started_at`, `finished_at`
- `telegram_links` — `id`, `user_id`, `token` unique, `expires_at`, `consumed_at`
- `api_keys` — `id`, `workspace_id`, `provider`, `ciphertext` bytea, `nonce` bytea, `key_fingerprint` (libsodium-sealed; per-user wrap key in browser localStorage; mirrors space-agent userCrypto)
- `shares` — `id`, `token` unique, `resource_id`, `encrypted` bool, `salt` bytea null, `expires_at`, `clone_count`, `created_by`
- `subscriptions` — `workspace_id` pk, `stripe_subscription_id`, `status`, `tier`, `current_period_end`
- `push_subscriptions` — for web-push
- `audit_log` — admin actions

### Layer resolution

`lib/db/layers.ts` implements `resolveResource(kind, name, {workspaceId, userId})`:

```
SELECT * FROM resources WHERE kind=$1 AND name=$2
  AND (
    (layer='L0')
    OR (layer='L1' AND workspace_id=$3)
    OR (layer='L2' AND workspace_id=$3 AND user_id=$4)
  )
ORDER BY CASE layer WHEN 'L2' THEN 0 WHEN 'L1' THEN 1 ELSE 2 END
LIMIT 1;
```

L0 seeded once via `seed.ts` (firmware skills, default widgets, onboarding template). L1/L2 are writable per role.

### Agent runtime (`lib/agent/`)

Single `runAgent({userId, workspaceId, deskId, channel, text, onDelta, onToolCall})` consumed by `/api/chat/stream`, Telegram webhook, and Admin Agent. Pipeline mirrors `docs/space-agent/app/L0/_all/mod/_core/agent_prompt/prompt-runtime.js`:

1. **Resolve context** — desk, recent messages, active widgets, channel
2. **prompt-builder.ts** — `[system, skills(loaded, placement=system), memory.persistent, transient.includes, resolved-via-layers, compactedHistory, userMsg]`. Token budget via `tiktoken`; summarize-and-drop oldest pairs over budget.
3. **skills-loader.ts** — DB query with layer resolution; parse frontmatter via `gray-matter`; evaluate `when` against `{deskId, channel, recentMessages, activeWidgets}`
4. **Tool dispatch** — agent emits tool calls (`desk.create`, `widget.add`, `widget.patch`, `skill.write`, `memory.write`, `browser.navigate`, `code.exec`); each tool is a typed handler in `lib/agent/tools/`; status streamed as execution cards
5. **LLM client** — `openrouter-client.ts` (streaming) or `local-llm.ts` (Transformers.js Web Worker); workspace's decrypted key
6. **Persist** — append assistant message + tool_calls; bump `resource_versions` for any writes

### Sandboxed JS execution

Agent-authored widget renderers and code-exec calls run in a sandboxed `<iframe sandbox="allow-scripts">` with a `postMessage` bridge exposing only: `desk.read`, `widget.patch(self)`, `fetch` (workspace-scoped allowlist), `console`. No DOM access to parent. Heavy local-LLM and code-exec workloads use a dedicated Web Worker (`lib/sandbox/worker.ts`).

### In-app browser widget

`BrowserWidget` defaults to `<iframe sandbox>` for embeddable sites. For sites that refuse framing, the widget proxies through `/api/browser/command` → Browserless (or self-hosted Playwright). Agent dispatches semantic commands; backend returns rendered HTML + screenshot + DOM digest.

### Telegram integration

One bot, token in env. `scripts/set-telegram-webhook.ts` registers webhook with secret. **Link flow**: `/settings/telegram` → `/api/telegram/link` mints token → QR + `https://t.me/<bot>?start=<token>`. Webhook consumes token, sets `users.telegram_chat_id`. **Message flow**: webhook → resolve `chat_id → user → default_desk` → `runAgent({channel:'telegram'})` → `sendChatAction('typing')` + placeholder → `editMessageText` every ~600ms (Telegram rate limit). **Commands**: `/new`, `/clear`, `/desk <slug>`, `/help`. Tool-call cards rendered as code-fenced blocks in Telegram.

### Sharing & import/export

`lib/sharing/zip-bundle.ts` packs `{ resource.json, versions.json, widgets/*.json, assets/* }` via `jszip`. Optional AES-GCM encryption with passphrase-derived key (Web Crypto). Hosted shares stored in `shares` table with token URL. Clone copies resource into requester's L2.

### Time travel

Every write to `resources` appends a `resource_versions` row (jsonb diff via `fast-json-patch`). UI at `/history` lists versions per resource with diff view + one-click rollback (creates a new version that restores prior content — never destructive).

### Frontend / mobile-first

- RSC for desk lists, settings, history, skills/memories management
- Client components for canvas (`DeskCanvas` with `react-grid-layout`), chat (`ChatStream`), widgets, agent overlay
- Bottom nav: **Desks / Chat / Skills / Settings**
- Desk page: canvas with `AgentOverlay` (bottom-sheet on mobile, side panel ≥ md)
- Swipe-down dismiss (Framer Motion); long-press to rearrange widgets
- `viewport-fit=cover` + `env(safe-area-inset-*)`; tap targets ≥ 44px; no hover-only affordances
- Glass dark theme: Tailwind tokens (`backdrop-blur`, `border-white/10`, `bg-white/5`); `AnimatedBackdrop` canvas component
- Streaming render: `MarkdownPatcher` mutates last assistant block in place per token; sticky scroll preserved when at bottom
- Execution cards: terminal-style card with status icon, live stdout, expandable args/output, sanitized URLs

### Streaming

Route handlers (not server actions). `app/api/chat/stream/route.ts` returns `ReadableStream` of `text/event-stream` carrying `{type:'delta'|'tool_call'|'tool_result'|'done', ...}`. Client `fetch` + reader. Final assistant message + tool_calls persisted before close.

### PWA + push

`public/manifest.json` (standalone, theme color, icon set). `next-pwa` for service worker (Workbox precache + runtime cache). `web-push` for new-Telegram-message notifications when web tab closed.

### Multi-tenancy, roles, billing

Every query filtered by `workspace_id` resolved from the NextAuth session user via `middleware.ts`. Drizzle helper `withWorkspace(ws)`. Roles: `owner|admin|member|global_admin`. Phase-5 Stripe Checkout; webhook updates `subscriptions`; tier gates in `lib/billing/limits.ts`: free (3 desks, 50k tokens/mo, shared bot), pro (unlimited desks, BYO bot, headless browser, push, encrypted shares).

### Onboarding

On workspace create, `seed-onboarding-template.ts` clones the L0 onboarding template into the new workspace's L1 — a welcome desk with a Markdown widget, a Skills tutorial widget, and a sample skill demonstrating agent-built UI.

## Phased rollout

| Phase | Scope | Acceptance |
|---|---|---|
| **P1 — Foundation** | NextAuth + Drizzle migrations + workspaces + L0/L1/L2 layer resolver + onboarding seed + basic Desks CRUD + glass theme shell | Sign up → workspace + onboarding desk auto-created |
| **P2 — Chat runtime** | OpenRouter streaming + `runAgent` + `prompt-builder` + skills-loader + memory + execution cards + markdown patcher | Send message → streamed reply with tool_call cards rendered live |
| **P3 — Agent-built UI** | Widget canvas + builtin widgets + sandboxed iframe widgets + agent tools (`desk.create`, `widget.add`, `widget.patch`, `skill.write`) | Agent prompt "build me a kanban" → widget appears on desk and persists |
| **P4 — Time travel + sharing** | `resource_versions` + diff/rollback UI + ZIP bundle + hosted shares + import/export + encrypted shares | Roll back any change; share desk; clone via public URL |
| **P5 — Telegram** | Webhook + link flow + streaming edits + slash commands | `/start <token>` links account; replies stream within 2s |
| **P6 — Browser + local LLM** | BrowserWidget (iframe + headless) + Transformers.js Web Worker | Agent navigates a site; user runs a small local model |
| **P7 — PWA + push + admin agent** | Manifest + service worker + web-push + Admin Agent route + global-admin tools | Lighthouse PWA ≥ 90; admin can manage workspaces from chat |
| **P8 — Billing + polish** | Stripe + tier limits + members invites + audit log + visual polish | Free → Pro gates BYO bot, desk count, headless browser |

## Critical files to write first

1. `d:\DEV-D\desksAI\package.json`
2. `d:\DEV-D\desksAI\drizzle.config.ts`
3. `d:\DEV-D\desksAI\lib\db\schema.ts`
4. `d:\DEV-D\desksAI\lib\db\layers.ts`
5. `d:\DEV-D\desksAI\middleware.ts`
6. `d:\DEV-D\desksAI\app\layout.tsx` + `(app)\layout.tsx`
7. `d:\DEV-D\desksAI\lib\agent\runtime.ts`
8. `d:\DEV-D\desksAI\lib\agent\prompt-builder.ts`
9. `d:\DEV-D\desksAI\lib\agent\skills-loader.ts`
10. `d:\DEV-D\desksAI\lib\agent\openrouter-client.ts`
11. `d:\DEV-D\desksAI\lib\agent\tools\index.ts` (+ desk, widget, skill, memory, browser, code-exec)
12. `d:\DEV-D\desksAI\lib\sandbox\iframe-bridge.ts`
13. `d:\DEV-D\desksAI\app\api\chat\stream\route.ts`
14. `d:\DEV-D\desksAI\components\canvas\DeskCanvas.tsx` + `WidgetFrame.tsx`
15. `d:\DEV-D\desksAI\components\chat\ChatStream.tsx` + `ExecutionCard.tsx` + `MarkdownPatcher.tsx`
16. `d:\DEV-D\desksAI\app\api\telegram\webhook\route.ts`
17. `d:\DEV-D\desksAI\public\manifest.json`
18. `d:\DEV-D\desksAI\scripts\seed.ts` (L0 firmware: default skills, builtin widget definitions, onboarding template)

## Patterns to port from space-agent

- Prompt assembly: `docs/space-agent/app/L0/_all/mod/_core/agent_prompt/prompt-runtime.js`
- Skills frontmatter + placement: `docs/space-agent/app/L0/_all/mod/_core/skills/`
- Memory persistent vs transient: `docs/space-agent/app/L0/_all/mod/_core/memory/`
- Onscreen agent overlay UX: `docs/space-agent/app/L0/_all/mod/_core/onscreen_agent/`
- OpenRouter request shape: `docs/space-agent/app/L0/_all/mod/_core/open_router/`
- Widget canvas + YAML widget defs: `docs/space-agent/app/L0/_all/mod/_core/spaces/`
- userCrypto seal pattern: `docs/space-agent/app/L0/_all/mod/_core/user_crypto/` + `server/lib/auth/`
- Time-travel UX: `docs/space-agent/app/L0/_all/mod/_core/time_travel/`
- Hosted share clone flow: `docs/space-agent/server/lib/share/`

## Verification

- Local: `docker compose up postgres` → `pnpm db:migrate` → `pnpm db:seed` → `pnpm dev` → `ngrok http 3000` → `pnpm tg:set-webhook`
- Test matrix: desktop Chrome, iOS Safari (PWA install + add to home screen), Telegram mobile + desktop
- Lighthouse mobile audit ≥ 90 PWA
- Playwright e2e: auth → onboarding desk visible → chat stream → agent adds widget → rollback widget add → share desk → clone in second account → Telegram link round-trip
- Manual: prompt agent "build me a habit tracker widget" — verify widget renders sandboxed, persists, and rolls back; send Telegram message — verify streams to web tab in real time and persists with correct `conversation_id` and `channel='telegram'`
