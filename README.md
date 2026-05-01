# DeskAI-Agent

DesksAI is a Next.js 16 App Router SaaS remake of Space Agent. It uses Postgres, Drizzle, NextAuth credentials auth, OpenRouter streaming, and a mobile-first glass UI.

## Current Status

- P1 Foundation: complete
- P2 Chat runtime: complete
- P3 Agent-built UI: pending

Implemented:

- Email/password sign-up and sign-in with NextAuth
- Workspace provisioning and onboarding desk seed flow
- L0/L1/L2 resource schema and resolver
- Desks CRUD
- OpenRouter streaming runtime
- Agent tool dispatch and execution cards
- Public/signed-out Playwright UX tests
- Static QA contract tests and live smoke tests

## Requirements

- Node 20+
- pnpm
- Docker Desktop
- OpenRouter API key for live chat

## Setup

```bash
pnpm install
cp .env.example .env.local
```

Set these values in `.env.local`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/desksai
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=replace-with-a-random-secret
OPENROUTER_API_KEY=sk-or-...
```

Start Postgres, migrate, and seed:

```bash
docker compose up -d postgres
pnpm db:migrate
pnpm db:seed
```

Run the app:

```bash
pnpm dev -p 3001
```

Open `http://localhost:3001`.

## QA

```bash
pnpm lint
pnpm test:qa
pnpm test:e2e
pnpm build
```

With a dev server running:

```bash
pnpm qa:smoke
```

## Notes

- Docker Postgres defaults to host port `5433` to avoid conflicts with other local Postgres containers.
- `.env.local` is intentionally ignored.
- The authenticated end-to-end flow is scaffolded but skipped until a disposable test database flow is added.
