# DesksAI Manual User Flow Tests

Last updated: 2026-05-04

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
- Visit `/fr`
- Expect redirect to `/fr/sign-in`
- Visit `/desks` while signed out
- Expect redirect to `/sign-in`
- Visit `/fr/desks` while signed out
- Expect redirect to `/fr/sign-in`
- Visit `/sign-in`
- Expect English email/password sign-in form
- Visit `/fr/sign-in`
- Expect French email/password sign-in form
- Visit `/sign-up`
- Expect English email/password sign-up form
- Visit `/fr/sign-up`
- Expect French email/password sign-up form

## Flow 2: Sign Up

Steps:

1. Go to `/sign-up` or `/fr/sign-up`
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
- Browser lands on `/desks` for English or `/fr/desks` for French

If this fails:

- Confirm `pnpm db:migrate` ran successfully
- Confirm `pnpm db:seed` ran successfully
- Confirm `NEXTAUTH_SECRET` exists
- Confirm database is running on port `5433`

## Flow 3: Sign In

Steps:

1. Go to `/sign-in` or `/fr/sign-in`
2. Enter an existing email and password
3. Submit the form

Expected current behavior:

- User signs in
- Browser lands on `/desks` for English or `/fr/desks` for French
- Desk list loads without server errors

Negative check:

- Enter a wrong password
- Expect visible invalid credentials message in the current locale

## Flow 4: Desks List

Steps:

1. Sign in
2. Go to `/desks` or `/fr/desks`

Expected current behavior:

- Page title says `Desks` in English and `Bureaux` in French
- Existing desks appear as cards
- Each card shows widget count and model badge
- Bottom nav is visible
- Locale switcher is visible and toggles `/desks` <-> `/fr/desks`

## Flow 5: Create Desk

Steps:

1. Go to `/desks` or `/fr/desks`
2. Click create desk button
3. Enter a desk name
4. Submit

Expected current behavior:

- New desk is created
- New desk card appears in the list
- Clicking the card opens `/desks/<deskId>` for English or `/fr/desks/<deskId>` for French

## Flow 6: Desk Detail Page - Canvas

Steps:

1. Open any desk from `/desks` or `/fr/desks`

Expected current behavior:

- tldraw infinite whiteboard canvas fills the full viewport
- Desk name and widget count appear as a floating overlay (top-left)
- "Add Widget" button floats top-right
- tldraw drawing toolbar is visible (pen, shapes, text, etc.)
- Existing widgets appear as draggable/resizable cards on the canvas
- Scroll wheel zooms in/out; spacebar+drag or middle-mouse pans
- Single-click selects/drags a widget; double-click enters interactive mode
- Agent panel is visible (fixed position, works alongside canvas)
- On mobile viewport: agent panel behaves as a bottom sheet

Current status:

- Canvas replaced with tldraw infinite whiteboard (P-Canvas phase, 2026-05-04)
- Widget cards are tldraw custom shapes; drag/resize handled natively by tldraw
- Widget positions persist to DB via PATCH `/api/widgets/[id]` (1s debounce)
- Drawing tool state persists to localStorage via `persistenceKey="desk-{id}"`
- Builtin widget types: markdown, kanban, browser (iframe), code, chart, form, iframe, todo, richtext, whiteboard
- Custom widgets run in sandboxed iframes with `sandbox="allow-scripts"` and postMessage bridge
- Widget Picker modal available via "Add Widget" button in toolbar overlay
- WidgetFrame shows edit (pencil), delete (trash), settings (gear) controls per widget type

## Flow 7: Chat Agent - Basic

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

## Flow 8: Chat Agent - Tool Calls

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

1. Open a desk and instruct the agent to make several changes (for example add, edit, or remove a widget)
2. Call `GET /api/resources/<resourceId>/versions` or use the `VersionList` component

Expected current behavior:

- Version list returns all past states newest-first
- Each version has a timestamp, author, and JSON diff from the previous version

Rollback check:

1. `POST /api/resources/<resourceId>/rollback` with `{ versionId: "<id>" }`
2. Expect resource content to revert to that version
3. Expect a new version row created for the rollback (append-only; history is never mutated)

Current status:

- Version API fully implemented at `/api/resources/[id]/versions` and `/api/resources/[id]/rollback`
- `VersionList` component exists at `components/history/VersionList.tsx`
- No rollback UI button on the desk detail page yet; API-only

## Flow 10: Desk Export / Import

Steps:

1. Call `exportDesk(deskId, workspaceId)` from `lib/sharing/export.ts` (or via a test script)
2. Inspect the JSON; expect `{ version, desk, skills, exportedAt, exportedBy }`
3. Call `importDesk(exportedJson, workspaceId, userId)` into a different workspace or as a new desk

Expected current behavior:

- All desk widgets are included with their props and layout
- Workspace skills referenced by the desk are bundled
- Import creates the desk and all widgets transactionally
- Skills are skipped if a skill with the same name already exists in the target workspace
- All imported resources have a version row created

Current status:

- Export and import utilities fully implemented (`lib/sharing/export.ts`, `lib/sharing/import.ts`)
- No UI entry point yet; callable from server code or scripts only
- ZIP bundle and encrypted share links deferred to a later phase

## Flow 11: Sign Out

Current status:

- No visible sign-out button in the UI yet

Manual workaround:

- Clear browser cookies for `localhost:3001`
- Or use browser devtools -> Application -> Clear Site Data

Expected after clearing session:

- Visiting `/desks` redirects to `/sign-in`
- Visiting `/fr/desks` redirects to `/fr/sign-in`

## Flow 12: Widget Picker — Add Prebuilt Widget

Requires: signed-in user, existing desk

Steps:

1. Open a desk detail page
2. If the desk is empty: click "Add Widget" in the empty state
3. If the desk has widgets: click the "Add Widget" button below the grid
4. Widget Picker modal opens
5. Verify category tabs: All / Productivity / Content / Web
6. Click the "Notes" card
7. Modal closes immediately
8. Markdown widget appears on the canvas

Expected current behavior:

- Modal is centered on desktop, full-width bottom sheet on mobile
- Each widget card shows an icon, label, and description
- Clicking a card POSTs to `/api/widgets` and adds the widget optimistically
- Widget appears in the canvas grid without page reload
- On error: widget card shows error state, modal stays open

Repeat for: Todo, Kanban, CRM Pipeline, Rich Text, Whiteboard, Code Block, Browser

## Flow 13: Widget Editing — Inline Edit Mode

Steps:

1. Add a Markdown (Notes) widget via the picker
2. Click the pencil icon in the widget header
3. Widget switches to a textarea showing the raw markdown
4. Edit the content
5. Click "Done" (or click the pencil again which becomes active/cyan)
6. Widget returns to display mode with updated content
7. Reload the page
8. Verify updated content persists

Expected current behavior:

- Pencil icon is cyan/active while in edit mode
- Done saves via PATCH `/api/widgets/[id]`
- Content survives page reload

Repeat for: Kanban (add card to a column), Code (change code and language)

## Flow 14: Todo Widget Interaction

Steps:

1. Add a Todo List widget via the picker
2. Verify default items appear with checkboxes
3. Click a checkbox to mark an item done
4. Verify item gets strikethrough immediately (optimistic)
5. Reload page
6. Verify checked state persists
7. Click pencil to enter edit mode
8. Type a new task in the input at the bottom, press Enter
9. Verify new task appears
10. Click the × on a task to delete it
11. Reload and verify state

Expected current behavior:

- Checkbox toggles are always interactive (no edit mode needed to check/uncheck)
- Add/delete tasks only available in edit mode
- All state persists via PATCH `/api/widgets/[id]`

## Flow 15: Widget Delete

Steps:

1. Open any desk with at least one widget
2. Click the trash icon in the widget header
3. Inline confirmation row appears: "Delete this widget? [Delete] [Cancel]"
4. Click Cancel — widget remains
5. Click trash again, then Delete
6. Widget disappears from canvas
7. Reload page
8. Verify widget is gone

Expected current behavior:

- DELETE fires to `/api/widgets/[id]`
- Widget removed optimistically from canvas
- Version row created for audit trail (rollback via API if needed)

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
- No rollback or time-travel UI button on the desk detail page (API-only)
- No diff viewer for comparing versions visually
- No ZIP bundle or encrypted share link UI
- Export/import has no UI entry point
- Calendar widget not implemented (deferred to V2)
- Kanban card drag-reorder between columns not implemented (deferred to V2)
- Whiteboard widget shows tldraw default UI (no custom toolbar or branding yet)
- RichText widget has no image upload or link insertion (starter-kit only)
- `tests/qa/static-contracts.test.mjs` references old non-localized route path (pre-existing, needs fix)
- `next.config.ts` hardcodes `serverActions.allowedOrigins` to `localhost:3000` (pre-existing, needs fix before VPS deploy)
- No Telegram bot handler or webhook route (schema ready, P5)
- No headless Browserless backend (browser tool is a stub, P6)
- No PWA install prompt, push subscription management, or admin agent route (P7)
- No Stripe webhook handler, billing UI, or member invite flow (P8)
- Authenticated Playwright e2e flow is scaffolded but skipped
