# DesksAI QA Testing

Last updated: 2026-05-01

## Automated Checks

Run the local static QA contracts:

```bash
pnpm test:qa
```

Run the live smoke test against a running dev server:

```bash
pnpm qa:smoke
```

By default the smoke test targets `http://localhost:3001`. Override with:

```bash
$env:QA_BASE_URL="http://localhost:3000"; pnpm qa:smoke
```

Run browser-based UX checks:

```bash
pnpm test:e2e
```

Run the interactive Playwright UI:

```bash
pnpm test:e2e:ui
```

By default Playwright targets `http://localhost:3001`, starts `pnpm dev -p 3001` when needed, and reuses an existing server if one is already running. Override with:

```bash
$env:PLAYWRIGHT_BASE_URL="http://localhost:3000"; pnpm test:e2e
```

Current automated browser coverage:

- `/api/health` responds with `{ ok: true }`
- `/manifest.json` is available
- signed-out `/` redirects to `/sign-in`
- `/sign-in` and `/sign-up` are reachable
- signed-out `/desks` requests redirect to `/sign-in`
- signed-out `/api/chat/stream` requests redirect to `/sign-in`

The authenticated UX flow is scaffolded in `tests/e2e/authenticated-flow.todo.spec.ts` and can be enabled once a test database is available.

## Manual P1/P2 QA

### Environment

- `.env.local` exists and includes `DATABASE_URL`
- `.env.local` includes `NEXTAUTH_SECRET`
- `.env.local` includes `NEXTAUTH_URL`
- `.env.local` includes `OPENROUTER_API_KEY`
- Postgres is running
- Migrations and seed have been applied

### App Shell

- Visit `/api/health`; expect HTTP 200 with `{ ok: true }`
- Visit `/sign-in`; expect the email/password sign-in form
- Visit `/sign-up`; expect the email/password sign-up form
- Visit `/desks` while signed out; expect redirect to sign-in
- Sign in; expect `/desks` to render without server errors
- Confirm bottom navigation is visible, touch-sized, and not covering content

### Desks CRUD

- Create a new Desk from `/desks`
- Confirm the Desk card appears with widget count and model badge
- Open the Desk detail page
- Confirm the page header shows Desk name and widget count

### Chat Runtime

From a Desk detail page:

- Send `hello`; expect a streamed assistant response
- Send `list my desks`; expect a tool execution card for `desk.list`
- Send `create a desk called QA Test`; expect a `desk.create` tool card and the new Desk on `/desks`
- Send `add a markdown widget to this desk called Notes`; expect a `widget.add` card and the widget placeholder on refresh
- Expand an execution card; expect readable `args` and `output`

### Negative Cases

- Temporarily remove `OPENROUTER_API_KEY`; sending chat should produce a visible error message, not a blank stream
- Submit an empty chat message; send button should be disabled
- Visit a non-existent `/desks/not-real`; expect 404

## Current Known Gaps

- Automated sign-up/sign-in flow needs a disposable test database
- Widget canvas and real widget rendering are P3
- `code.exec` returns a sandbox-dispatch stub until P3
- Browser tools are stubs until P6
- Time travel and rollback are P4
- Telegram is P5
