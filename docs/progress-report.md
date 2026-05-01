# DesksAI — Progress Report

Last updated: 2026-05-01

## Phase status

| Phase | Status | Date |
|---|---|---|
| P1 — Foundation | ✅ complete | 2026-04-30 |
| P2 — Chat runtime | ✅ complete | 2026-05-01 |
| P3 — Agent-built UI | ✅ complete | 2026-05-01 |
| P4 — Time travel + sharing | ⬜ pending | — |
| P5 — Telegram | ⬜ pending | — |
| P6 — Browser + local LLM | ⬜ pending | — |
| P7 — PWA + push + admin agent | ⬜ pending | — |
| P8 — Billing + polish | ⬜ pending | — |

---

## P1 — Foundation ✅

**Completed**: 2026-05-01

### What was built

**Config & tooling**
- `package.json` — pnpm workspace, all deps (Drizzle, NextAuth, OpenRouter, libsodium, react-grid-layout, tiktoken, jszip, framer-motion, etc.)
- `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `drizzle.config.ts`
- `docker-compose.yml` — Postgres 16 on host port 5433 by default
- `.env.example` — all required env vars documented

**Database layer**
- `lib/db/schema.ts` — full Drizzle schema: users, workspaces, workspace_members, resources (unified L0/L1/L2), resource_versions, widget_instances, conversations, messages, tool_calls, telegram_links, api_keys, shares, subscriptions, push_subscriptions, audit_log
- `lib/db/client.ts` — lazy Postgres connection via Proxy (no DATABASE_URL required at build time)
- `lib/db/layers.ts` — `resolveResource()` and `resolveAllResources()` with L2>L1>L0 priority

**Auth**
- `middleware.ts` — NextAuth middleware; protects all routes except public + Telegram webhook; admin gate
- `lib/auth/workspace.ts` — `getCurrentUser()`, `requireWorkspace()`, `resolveUserWorkspace()` helpers
- `lib/auth/roles.ts` — `getMemberRole()`, `requireRole()`, `isGlobalAdmin()`

**App shell**
- `app/layout.tsx` — PWA meta, glass dark bg, `force-dynamic`
- `app/globals.css` — Tailwind v4 + glass tokens (`--glass-bg`, `--glass-border`, `--glass-blur`), safe-area insets, `.glass` utility class
- `app/(auth)/sign-in` + `sign-up` — email/password auth pages
- `app/(app)/layout.tsx` — AnimatedBackdrop + BottomNav shell; `pb-16 safe-top` content area
- `app/page.tsx` — root redirect (→ /desks if authed, → /sign-in if not)

**Components**
- `components/visual/AnimatedBackdrop.tsx` — canvas orb animation (4 purple/blue orbs)
- `components/visual/GlassSurface.tsx` — reusable glass card primitive
- `components/mobile/BottomNav.tsx` — sticky bottom nav: Desks / Chat / Skills / Settings, 44px targets, `aria-current`
- `components/desk/DeskCard.tsx` — desk list card with widget count, model badge, delete button
- `components/desk/CreateDeskButton.tsx` — inline create form with transition

**Pages & API**
- `app/(app)/desks/page.tsx` — RSC desk list page
- `app/api/desks/route.ts` — GET (list) + POST (create)
- `app/api/desks/[id]/route.ts` — GET + PATCH + DELETE (soft-archive)
- `app/api/workspaces/route.ts` — POST: provision workspace + onboarding desk from L0 template
- `app/api/health/route.ts` — `{ ok: true }`

**Scripts**
- `scripts/migrate.ts` — Drizzle migrator
- `scripts/seed.ts` — L0 firmware: 3 core skills, 7 builtin widget defs, onboarding template
- `scripts/seed-onboarding-template.ts` — clone L0 template into a workspace
- `public/manifest.json` — PWA manifest (basic)
- `lib/utils.ts` — `cn()`, `generateId()`, `slugify()`

### Key decisions

- **Lazy DB client via Proxy** — avoids DATABASE_URL being required at build time; Next.js static generation works without env vars
- **`force-dynamic` on root layout** — keeps session-bound app pages dynamic
- **Bytea as customType** — Drizzle pg-core doesn't export `bytea` directly; uses `customType` wrapper
- **Soft delete for desks** — sets `archivedAt` instead of DELETE; preserves resource_versions history

### Deferred to later phases

- Desk canvas + widget rendering (P3)
- Agent chat (P2)
- Time travel UI (P4)
- Telegram (P5)

---

## P2 — Chat runtime

**Completed**: 2026-04-30

### What was built

**Agent runtime**
- `lib/agent/openrouter-client.ts` — streaming OpenRouter client with text and tool-call delta handling
- `lib/agent/prompt-builder.ts` — prompt assembly with system skills, memories, history trimming, transient skills, and current user input
- `lib/agent/skills-loader.ts` — layer-resolved skills with frontmatter metadata and simple `when` matching
- `lib/agent/memory-store.ts` — persistent/transient memory helpers
- `lib/agent/conversation-store.ts` — conversation, message, and tool-call persistence; fixed Drizzle query composition with `and()`
- `lib/agent/runtime.ts` — `runAgent()` orchestration: context resolution, prompt build, OpenRouter stream, tool dispatch, assistant/tool persistence

**Tools**
- `lib/agent/tools/index.ts` — tool definition aggregation, OpenRouter-safe function-name mapping, and dispatch
- `lib/agent/tools/desk.ts` — `desk.create`, `desk.patch`, `desk.list`
- `lib/agent/tools/widget.ts` — `widget.add`, `widget.patch`, `widget.remove`, `widget.list`
- `lib/agent/tools/skill.ts` — `skill.write`, `skill.list`
- `lib/agent/tools/memory.ts` — `memory.write`, `memory.list`
- `lib/agent/tools/browser.ts` — P6 browser stub
- `lib/agent/tools/code-exec.ts` — P3 sandbox execution stub

**Streaming API & UI**
- `lib/sse/stream.ts` — SSE event helpers
- `app/api/chat/stream/route.ts` — POST endpoint streaming `{delta|tool_call|tool_result|done|error}` events
- `components/chat/ChatStream.tsx` — live chat client with streaming reader
- `components/chat/MessageBubble.tsx` — user/assistant message bubble
- `components/chat/ExecutionCard.tsx` — expandable tool execution card with running/done/error states
- `components/chat/MarkdownPatcher.tsx` — live assistant text renderer
- `components/agent/AgentOverlay.tsx` — mobile bottom sheet / desktop right panel wrapper
- `app/(app)/desks/[id]/page.tsx` — desk detail page with widget placeholders and agent overlay

**Tooling**
- `eslint.config.mjs` — ESLint 9 flat config for Next so `pnpm lint` runs
- `lib/db/client.ts` — removed stale lint suppressions and used `Reflect.get` in the lazy DB proxy

### Key decisions

- OpenRouter tool names are normalized from product-facing names like `widget.add` to API-safe names like `widget_add`, then mapped back before dispatch and UI rendering.
- Runtime supports up to four tool-call rounds so a model can call tools and then continue with a streamed response.
- Browser and code execution tools are visible to the agent but remain explicit stubs until P3/P6.

### Verification

- `pnpm lint` — passed
- `pnpm build` — passed; Next reports the existing `middleware` convention deprecation warning

### Deferred to later phases

- Real widget canvas/renderers and iframe execution (P3)
- Markdown-to-sanitized-HTML rendering improvements beyond live safe text output
- Time-travel `resource_versions` writes for agent mutations (P4)

---

## P3 — Agent-built UI

**Completed**: 2026-05-01

### What was built

**Canvas**
- `components/canvas/DeskCanvas.tsx` — client canvas backed by `react-grid-layout`, with drag/resize handles and persisted layout PATCHes.
- `components/canvas/WidgetFrame.tsx` — glass widget frame with accessible drag handle, status affordance, and stable header/body sizing.
- `components/canvas/WidgetRenderer.tsx` — builtin renderer switch for markdown, kanban, browser, code, chart, form, iframe, and custom widgets.
- `app/(app)/desks/[id]/page.tsx` — replaced placeholder JSON cards with real canvas widgets derived from persisted `widget_instances`.

**Builtin widgets**
- `components/widgets/builtin/Markdown.tsx` — safe lightweight markdown rendering for headings, bullets, and bold text.
- `components/widgets/builtin/Kanban.tsx` — column/card renderer for agent-created boards.
- `components/widgets/builtin/Browser.tsx` — sandboxed iframe browser widget for HTTP(S) URLs.
- `components/widgets/builtin/Code.tsx` — code viewer with language label.
- `components/widgets/builtin/Chart.tsx` — dependency-free bar chart renderer.
- `components/widgets/builtin/Form.tsx` — schema-driven form renderer.
- `components/widgets/builtin/Iframe.tsx` — custom HTML/JS sandbox renderer.

**Sandbox + persistence**
- `lib/sandbox/iframe-bridge.ts` — srcdoc builder exposing a minimal `window.DesksAI` API (`desk.read`, `widget.patch`, console proxy) inside `sandbox="allow-scripts"`.
- `app/api/widgets/[id]/route.ts` — workspace-scoped PATCH/DELETE route for widget props and layout updates.
- `components/chat/ChatStream.tsx` — dispatches live `code.exec` tool results into matching frontend sandboxes.
- `lib/types.ts` — shared desk/widget type contracts.

**QA**
- `tests/qa/static-contracts.test.mjs` — added P3 static contract tests for canvas rendering, builtin registry, sandbox dispatch, and workspace-scoped widget writes.

### Key decisions

- P3 uses a single persisted layout shape (`x/y/w/h`) and stores drag/resize changes through `/api/widgets/[id]`; responsive refinements can layer on without changing the DB contract.
- Custom widgets run in an iframe with `sandbox="allow-scripts"` and communicate through `postMessage`; parent-side writes still go through the authenticated widget API route.
- Chart rendering is implemented without adding a charting dependency so P3 stays within the existing package set.

### Verification

- `pnpm lint` — passed
- `pnpm test:qa` — passed (7 static contract tests)
- `pnpm test:e2e` — passed (12 public/signed-out UX checks, 2 authenticated-flow TODOs skipped)
- `pnpm build` — passed; Next still reports the existing middleware-to-proxy deprecation warning

### Deferred to later phases

- Resource version rows for widget mutations and rollback UI (P4)
- Headless Browserless fallback for sites that block iframe embedding (P6)
- Rich sanitized markdown rendering beyond the current safe lightweight widget renderer
