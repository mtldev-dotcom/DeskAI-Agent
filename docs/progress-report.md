# DesksAI - Progress Report

Last updated: 2026-05-01

## Phase status

| Phase | Status | Date |
|---|---|---|
| P1 - Foundation | complete | 2026-04-30 |
| P2 - Chat runtime | complete | 2026-05-01 |
| P3 - Agent-built UI | complete | 2026-05-01 |
| P4 - Time travel + sharing | complete | 2026-05-01 |
| P5 - Telegram | pending | - |
| P6 - Browser + local LLM | pending | - |
| P7 - PWA + push + admin agent | pending | - |
| P8 - Billing + polish | pending | - |

## Session notes - 2026-05-01

- Localized routing is active through `next-intl`; English routes are unprefixed and French routes use `/fr/...`.
- The chat overlay UI was refactored to reduce visual density:
  - stronger overlay shell
  - improved message bubbles and composer
  - compact execution cards
  - tool-call history moved behind an `Agent activity` accordion
  - all tool items are hidden by default until the accordion is opened
- Deployment readiness is close but not clean:
  - `pnpm build` passes
  - `pnpm lint` passes
  - `pnpm test:qa` currently fails because `tests/qa/static-contracts.test.mjs` still points at the old non-localized desk page path
  - `next.config.ts` still restricts `serverActions.allowedOrigins` to `localhost:3000`
- Next.js still emits the existing `middleware.ts` to `proxy.ts` deprecation warning during build.

## P1 - Foundation

Completed: 2026-04-30

Highlights:

- Core app shell, auth flow, desk CRUD, workspace provisioning, and database schema are in place.
- Drizzle, NextAuth, App Router, and the layered resource model are implemented.
- The app uses a lazy DB proxy so builds do not require a live `DATABASE_URL`.

Key files:

- `lib/db/schema.ts`
- `lib/db/client.ts`
- `lib/auth/workspace.ts`
- `lib/auth/roles.ts`
- `app/layout.tsx`
- `app/globals.css`
- `app/api/desks/route.ts`
- `app/api/desks/[id]/route.ts`
- `app/api/workspaces/route.ts`

## P2 - Chat runtime

Completed: 2026-05-01

Highlights:

- OpenRouter streaming runtime is implemented with conversation, memory, and tool persistence.
- Chat SSE streaming is wired through `/api/chat/stream`.
- The agent overlay, bubbles, composer, and execution cards are implemented.
- Current UI state includes the newer compact `Agent activity` accordion behavior.

Key files:

- `lib/agent/runtime.ts`
- `lib/agent/openrouter-client.ts`
- `lib/agent/prompt-builder.ts`
- `lib/agent/tools/index.ts`
- `app/api/chat/stream/route.ts`
- `components/chat/ChatStream.tsx`
- `components/chat/ExecutionCard.tsx`
- `components/chat/MessageBubble.tsx`
- `components/agent/AgentOverlay.tsx`

Verification:

- `pnpm build` passes
- `pnpm lint` passes

## P3 - Agent-built UI

Completed: 2026-05-01

Highlights:

- Desk canvas is backed by `react-grid-layout`.
- Persisted widgets render through the builtin widget registry.
- Widget layout and props persist through authenticated API routes.
- Sandbox dispatch from chat to iframe widgets is wired.

Key files:

- `components/canvas/DeskCanvas.tsx`
- `components/canvas/WidgetFrame.tsx`
- `components/canvas/WidgetRenderer.tsx`
- `components/widgets/builtin/*`
- `lib/sandbox/iframe-bridge.ts`
- `app/api/widgets/[id]/route.ts`
- `app/[locale]/(app)/desks/[id]/page.tsx`

Verification:

- P3 originally completed with green static contracts and E2E coverage
- Current note: `tests/qa/static-contracts.test.mjs` must be updated after the i18n route move before `pnpm test:qa` is considered green again

## P4 - Time travel + sharing

Completed: 2026-05-01

Highlights:

- Resource version creation, listing, and rollback helpers exist.
- Desk, widget, skill, and memory mutations write version rows.
- Import/export plumbing exists for desk portability.

Key files:

- `lib/db/versions.ts`
- `app/api/resources/[id]/versions/route.ts`
- `app/api/resources/[id]/rollback/route.ts`
- `lib/sharing/export.ts`
- `lib/sharing/import.ts`
- `components/history/VersionList.tsx`

## Remaining phases

- P5 - Telegram integration
- P6 - Browser + local LLM
- P7 - PWA + push + admin agent
- P8 - Billing + polish
