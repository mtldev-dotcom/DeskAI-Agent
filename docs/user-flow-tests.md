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
- Bottom nav is visible

## Flow 5: Create Desk

Steps:

1. Go to `/desks`
2. Click create desk button
3. Enter a desk name
4. Submit

Expected current behavior:

- New desk is created
- New desk card appears
- Clicking the card opens `/desks/<deskId>`

## Flow 6: Desk Detail Page

Steps:

1. Open any desk from `/desks`

Expected current behavior:

- Desk name appears at the top
- Widget count appears under the title
- Empty desk shows a placeholder canvas area
- Agent panel is visible
- On mobile-sized viewport, agent panel behaves like a bottom sheet
- On desktop-sized viewport, agent panel sits on the right

Current status:

- Real draggable widget canvas is implemented (P3)
- Widget cards are fully functional with drag/resize
- Builtin widgets: markdown, kanban, browser, code, chart, form, iframe
- Custom widgets run in sandboxed iframes

## Flow 7: Chat Agent

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

Tool-call checks:

Try these prompts:

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
- New desk appears after returning to `/desks`

```text
add a markdown widget to this desk called Notes
```

Expected:

- Execution card appears for `widget.add`
- Refreshing the desk page shows a placeholder widget card

Current status:

- Tool output persists with full time-travel/version history (P4 complete)
- Versioning API available at `/api/resources/[id]/versions`
- Rollback API available at `/api/resources/[id]/rollback`
- Markdown rendering is currently safe text, not rich sanitized HTML
- `code.exec` tool results are dispatched to matching frontend sandboxes
- Browser tools are only stubs until P6

## Flow 8: Sign Out

Current status:

- A visible sign-out control has not been added to the UI yet.

Manual workaround:

- Clear browser cookies for `localhost:3001`
- Or use browser devtools to clear site data

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

- No visible sign-out button yet
- Authenticated Playwright flow is scaffolded but skipped
- No rollback/time-travel UI component integrated into desk detail page
- ZIP sharing & encrypted hosted shares not implemented
- No Telegram flow yet
- No billing/member invite/admin UI yet
