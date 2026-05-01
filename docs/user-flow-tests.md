# DesksAI Manual User Flow Tests

Last updated: 2026-05-01

Use this checklist to manually test what currently works in the app. Keep this file updated whenever a flow changes.

## Before Testing

Start the database and app:

```bash
docker compose up -d postgres
pnpm db:migrate
pnpm db:seed
pnpm dev -p 3001
```

Open:

```text
http://localhost:3001
```

Required `.env.local` values:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/desksai
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=<random-secret>
OPENROUTER_API_KEY=<required-for-live-chat>
```

## Flow 1: Public App Access

Expected current behavior:

- Visit `/api/health`
- Expect JSON with `"ok": true`
- Visit `/`
- Expect redirect to `/sign-in`
- Visit `/desks` while signed out
- Expect redirect to `/sign-in`
- Visit `/sign-in`
- Expect email/password sign-in form
- Visit `/sign-up`
- Expect email/password sign-up form

## Flow 2: Sign Up

Steps:

1. Go to `/sign-up`
2. Enter a new email address
3. Enter a password with at least 8 characters
4. Enter a workspace name or leave it blank
5. Submit the form

Expected current behavior:

- Account is created
- User is automatically signed in
- Workspace is created
- User is added as workspace owner
- If L0 seed exists, a Welcome desk is created
- Browser lands on `/desks`

If this fails:

- Confirm `pnpm db:migrate` ran successfully
- Confirm `pnpm db:seed` ran successfully
- Confirm `NEXTAUTH_SECRET` exists
- Confirm database is running on port `5433`

## Flow 3: Sign In

Steps:

1. Go to `/sign-in`
2. Enter an existing email and password
3. Submit the form

Expected current behavior:

- User signs in
- Browser lands on `/desks`
- Desk list loads without server errors

Negative check:

- Enter a wrong password
- Expect visible `Invalid email or password`

## Flow 4: Desks List

Steps:

1. Sign in
2. Go to `/desks`

Expected current behavior:

- Page title says `Desks`
- Existing desks appear as cards
- Each card shows widget count and model badge
- Bottom nav is visible (Desks / Chat / Skills / Settings)

## Flow 5: Create Desk

Steps:

1. Go to `/desks`
2. Click create desk button
3. Enter a desk name
4. Submit

Expected current behavior:

- New desk is created
- New desk card appears in the list
- Clicking the card opens `/desks/<deskId>`

## Flow 6: Desk Detail Page — Canvas

Steps:

1. Open any desk from `/desks`

Expected current behavior:

- Desk name appears at the top
- Widget count appears under the title
- Draggable/resizable widget canvas renders (backed by react-grid-layout)
- Each widget shows in a glass frame with a drag handle
- Empty desk shows an empty canvas area
- Agent panel is visible
- On mobile viewport: agent panel behaves as a bottom sheet
- On desktop viewport: agent panel sits on the right side

Current status:

- Real draggable/resizable widget canvas is implemented (P3)
- Widget layout changes (drag/resize) are persisted via PATCH `/api/widgets/[id]`
- Builtin widget types: markdown, kanban, browser (iframe), code, chart, form, iframe
- Custom widgets run in sandboxed iframes with `sandbox="allow-scripts"` and postMessage bridge

## Flow 7: Chat Agent — Basic

Requires:

- `OPENROUTER_API_KEY` in `.env.local`
- Signed-in user
- Existing desk

Steps:

1. Open a desk detail page
2. In the Agent panel, send `hello`

Expected current behavior:

- User message appears immediately
- Assistant response streams into the chat

## Flow 8: Chat Agent — Tool Calls

Steps:

1. Open a desk and send each prompt below

```text
list my desks
```

Expected:

- Execution card appears for `desk.list`
- Card can be expanded to inspect args/output

```text
create a desk called QA Manual Test
```

Expected:

- Execution card appears for `desk.create`
- New desk appears when returning to `/desks`

```text
add a markdown widget to this desk called Notes
```

Expected:

- Execution card appears for `widget.add`
- Widget appears on the canvas after the agent responds

```text
write a skill called "daily summary" that summarizes the desk contents each morning
```

Expected:

- Execution card appears for `skill.write`

```text
remember that I prefer short responses
```

Expected:

- Execution card appears for `memory.write`

Current status:

- All four tool surfaces (desk, widget, skill, memory) are fully wired
- Each tool mutation auto-creates a version row in `resource_versions`
- Browser and code-exec tools are stubs until P6

## Flow 9: Version History

Steps:

1. Open a desk and instruct the agent to make several changes (e.g., add/edit/remove a widget)
2. Call `GET /api/resources/<resourceId>/versions` or use the `VersionList` component

Expected current behavior:

- Version list returns all past states newest-first
- Each version has a timestamp, author, and JSON diff from the previous version

Rollback check:

1. `POST /api/resources/<resourceId>/rollback` with `{ versionId: "<id>" }`
2. Expect resource content to revert to that version
3. Expect a new version row created for the rollback (append-only — history is never mutated)

Current status:

- Version API fully implemented at `/api/resources/[id]/versions` and `/api/resources/[id]/rollback`
- `VersionList` component exists at `components/history/VersionList.tsx`
- No rollback UI button on the desk detail page yet — API-only

## Flow 10: Desk Export / Import

Steps:

1. Call `exportDesk(deskId, workspaceId)` from `lib/sharing/export.ts` (or via a test script)
2. Inspect the JSON — expect `{ version, desk, skills, exportedAt, exportedBy }`
3. Call `importDesk(exportedJson, workspaceId, userId)` into a different workspace or as a new desk

Expected current behavior:

- All desk widgets are included with their props and layout
- Workspace skills referenced by the desk are bundled
- Import creates the desk and all widgets transactionally
- Skills are skipped if a skill with the same name already exists in the target workspace
- All imported resources have a version row created

Current status:

- Export and import utilities fully implemented (`lib/sharing/export.ts`, `lib/sharing/import.ts`)
- No UI entry point yet — callable from server code / scripts only
- ZIP bundle and encrypted share links deferred to a later phase

## Flow 11: Sign Out

Current status:

- No visible sign-out button in the UI yet

Manual workaround:

- Clear browser cookies for `localhost:3001`
- Or use browser devtools → Application → Clear Site Data

Expected after clearing session:

- Visiting `/desks` redirects to `/sign-in`

## Automated Checks To Run

Run these after manual testing:

```bash
pnpm lint
pnpm test:qa
pnpm test:e2e
pnpm build
```

With the dev server running:

```bash
pnpm qa:smoke
```

## Known Current Gaps

- No visible sign-out button in the UI
- No rollback / time-travel UI button on the desk detail page (API exists, no UI control)
- No diff viewer for comparing versions visually
- No ZIP bundle or encrypted share link UI
- Export/import has no UI entry point — server-side only
- No Telegram bot handler or webhook route (schema ready, P5)
- No headless Browserless backend (browser tool is a stub, P6)
- No PWA install prompt, push subscription management, or admin agent route (P7)
- No Stripe webhook handler, billing UI, or member invite flow (P8)
- Authenticated Playwright e2e flow is scaffolded but skipped
