# DesksAI QA Testing

Last updated: 2026-05-01

## Automated checks

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

## Manual QA

### Environment

- `.env.local` exists and includes `DATABASE_URL`
- `.env.local` includes `NEXTAUTH_SECRET`
- `.env.local` includes `NEXTAUTH_URL`
- `.env.local` includes `OPENROUTER_API_KEY`
- Postgres is running
- Migrations and seed have been applied

### App shell

- Visit `/api/health`; expect HTTP 200 with `{ ok: true }`
- Visit `/sign-in`; expect the email/password sign-in form
- Visit `/fr/sign-in`; expect the French sign-in form
- Visit `/sign-up`; expect the email/password sign-up form
- Visit `/desks` while signed out; expect redirect to sign-in
- Visit `/fr/desks` while signed out; expect redirect to the French sign-in route
- Sign in; expect `/desks` to render without server errors
- Confirm bottom navigation is visible, touch-sized, and not covering content
- Confirm locale switching preserves navigation correctly between English and French routes

### Desks CRUD

- Create a new Desk from `/desks`
- Confirm the Desk card appears with widget count and model badge
- Open the Desk detail page
- Confirm the page header shows Desk name and widget count

### Chat runtime / agent overlay

From a Desk detail page:

- Send `hello`; expect a streamed assistant response
- Confirm the agent overlay opens with the updated header and composer styling
- Confirm `Agent activity` is visible only as a collapsed accordion header by default
- Open `Agent activity`; expect tool execution cards to appear inside the accordion body
- Close `Agent activity`; expect all tool items to be hidden again
- Send `list my desks`; expect a tool execution card for `desk.list`
- Send `create a desk called QA Test`; expect a `desk.create` tool card and the new Desk on `/desks`
- Send `add a markdown widget to this desk called Notes`; expect a `widget.add` card and the widget on the canvas on refresh
- Expand an execution card; expect readable `args` and `output`
- On mobile width, confirm tool history does not push the composer off-screen when the accordion is closed

### Negative cases

- Temporarily remove `OPENROUTER_API_KEY`; sending chat should produce a visible error message, not a blank stream
- Submit an empty chat message; send button should be disabled
- Visit a non-existent `/desks/not-real`; expect 404

## Current known gaps

- Automated sign-up/sign-in flow still needs a disposable test database
- `tests/qa/static-contracts.test.mjs` currently fails because it still references `app/(app)/desks/[id]/page.tsx` instead of `app/[locale]/(app)/desks/[id]/page.tsx`
- `next.config.ts` currently hardcodes `serverActions.allowedOrigins` to `localhost:3000`, which should be made deploy-safe before VPS testing
- `code.exec` still needs broader real-world validation beyond the current sandbox dispatch flow
- Browser tools are still stubs until P6
- Time-travel plumbing exists, but broader manual rollback verification is still needed
- Telegram is P5
