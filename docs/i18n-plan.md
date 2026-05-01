# DesksAI i18n Implementation Plan — English + French

> **For the executing agent:** This is a complete, self-contained implementation plan. Read it fully before touching any file. Follow every step in order. Do not skip the verification steps.

---

## Context

- Stack: Next.js 16.2 App Router, TypeScript strict, Tailwind v4, NextAuth 4
- No i18n library is installed yet — clean slate
- Current routes: `/`, `/sign-in`, `/sign-up`, `/desks`, `/desks/[id]`
- Current middleware (`middleware.ts`) handles NextAuth JWT auth — must be preserved
- All user-visible strings are hardcoded in English across ~10 components

## Goal

Add English + French support using `next-intl`. English has no URL prefix (`/desks`). French uses `/fr/` prefix (`/fr/desks`). API routes are untouched.

---

## Step 1 — Install next-intl

```bash
pnpm add next-intl
```

Verify it appears in `package.json` dependencies before continuing.

---

## Step 2 — Create message files

Create `messages/en.json`:

```json
{
  "nav": {
    "desks": "Desks",
    "chat": "Chat",
    "skills": "Skills",
    "settings": "Settings"
  },
  "auth": {
    "signInHeading": "Sign in",
    "signInSubheading": "Use your DesksAI account.",
    "signUpHeading": "Sign up",
    "signUpSubheading": "Create your workspace.",
    "email": "Email",
    "password": "Password",
    "workspace": "Workspace",
    "workspacePlaceholder": "My Workspace",
    "invalidCredentials": "Invalid email or password",
    "couldNotCreate": "Could not create account",
    "signInFailed": "Account created, but sign-in failed",
    "signingIn": "Signing in…",
    "creating": "Creating…",
    "signIn": "Sign in",
    "createAccount": "Create account",
    "noAccount": "No account?",
    "alreadyHaveAccount": "Already have an account?"
  },
  "desks": {
    "title": "Desks",
    "count_one": "{count} desk",
    "count_other": "{count} desks",
    "empty": "No desks yet. Create your first desk to get started.",
    "new": "New Desk",
    "namePlaceholder": "Desk name…",
    "create": "Create",
    "cancel": "Cancel"
  },
  "agent": {
    "thinking": "Thinking…",
    "toolRunning": "Running",
    "toolDone": "Done",
    "toolError": "Error",
    "send": "Send"
  },
  "history": {
    "title": "Version History",
    "rollback": "Rollback to this version",
    "noVersions": "No versions yet."
  },
  "meta": {
    "title": "DesksAI",
    "description": "Your AI-powered workspace"
  },
  "locale": {
    "switch": "Français"
  }
}
```

Create `messages/fr.json`:

```json
{
  "nav": {
    "desks": "Bureaux",
    "chat": "Chat",
    "skills": "Compétences",
    "settings": "Paramètres"
  },
  "auth": {
    "signInHeading": "Se connecter",
    "signInSubheading": "Utilisez votre compte DesksAI.",
    "signUpHeading": "S'inscrire",
    "signUpSubheading": "Créez votre espace de travail.",
    "email": "E-mail",
    "password": "Mot de passe",
    "workspace": "Espace de travail",
    "workspacePlaceholder": "Mon espace",
    "invalidCredentials": "E-mail ou mot de passe invalide",
    "couldNotCreate": "Impossible de créer le compte",
    "signInFailed": "Compte créé, mais la connexion a échoué",
    "signingIn": "Connexion…",
    "creating": "Création…",
    "signIn": "Se connecter",
    "createAccount": "Créer un compte",
    "noAccount": "Pas de compte ?",
    "alreadyHaveAccount": "Déjà un compte ?"
  },
  "desks": {
    "title": "Bureaux",
    "count_one": "{count} bureau",
    "count_other": "{count} bureaux",
    "empty": "Aucun bureau. Créez votre premier bureau pour commencer.",
    "new": "Nouveau bureau",
    "namePlaceholder": "Nom du bureau…",
    "create": "Créer",
    "cancel": "Annuler"
  },
  "agent": {
    "thinking": "Réflexion…",
    "toolRunning": "En cours",
    "toolDone": "Terminé",
    "toolError": "Erreur",
    "send": "Envoyer"
  },
  "history": {
    "title": "Historique des versions",
    "rollback": "Revenir à cette version",
    "noVersions": "Aucune version pour l'instant."
  },
  "meta": {
    "title": "DesksAI",
    "description": "Votre espace de travail alimenté par l'IA"
  },
  "locale": {
    "switch": "English"
  }
}
```

---

## Step 3 — Create i18n/request.ts

Create `i18n/request.ts`:

```ts
import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  if (!locale || !routing.locales.includes(locale as 'en' | 'fr')) {
    locale = routing.defaultLocale
  }
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
```

Create `i18n/routing.ts`:

```ts
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'fr'],
  defaultLocale: 'en',
  localePrefix: 'as-needed', // English: /desks  French: /fr/desks
})
```

---

## Step 4 — Update next.config.ts

Read `next.config.ts` first, then wrap the existing export with the next-intl plugin:

```ts
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

// wrap whatever is already the default export:
export default withNextIntl(existingConfig)
```

---

## Step 5 — Update middleware.ts

Read `middleware.ts` first — it currently does NextAuth JWT auth. Replace it entirely with a version that chains next-intl locale routing first, then applies the existing auth logic:

```ts
import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

const PUBLIC_PATHS = [
  '/sign-in',
  '/sign-up',
  '/api/auth',
  '/api/health',
  '/api/telegram/webhook',
  '/share',
  '/manifest.json',
]

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
}

export async function middleware(req: NextRequest) {
  // Strip locale prefix to check public paths
  const { pathname } = req.nextUrl
  const strippedPath = pathname.replace(/^\/fr/, '') || '/'

  // Always run intl middleware first (locale detection + redirect)
  const intlResponse = intlMiddleware(req)

  // Allow public routes through without auth check
  if (isPublic(strippedPath) || isPublic(pathname)) {
    return intlResponse
  }

  // Auth gate
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    const signIn = new URL('/sign-in', req.url)
    signIn.searchParams.set('callbackUrl', req.url)
    return NextResponse.redirect(signIn)
  }

  return intlResponse
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
}
```

---

## Step 6 — Restructure the app directory

This is the main structural change. Move route groups under a `[locale]` dynamic segment.

**Before:**
```
app/
  layout.tsx
  page.tsx
  (auth)/sign-in/...
  (auth)/sign-up/...
  (app)/layout.tsx
  (app)/desks/page.tsx
  (app)/desks/[id]/page.tsx
```

**After:**
```
app/
  layout.tsx              ← keep (root layout, minimal)
  page.tsx                ← keep (root redirect)
  [locale]/
    layout.tsx            ← NEW: sets lang attr, wraps NextIntlClientProvider
    (auth)/
      sign-in/[[...rest]]/page.tsx
      sign-up/[[...rest]]/page.tsx
    (app)/
      layout.tsx          ← move from (app)/layout.tsx
      desks/
        page.tsx
        [id]/page.tsx
```

**How to do the move:**
1. Create `app/[locale]/` directory
2. Create `app/[locale]/layout.tsx` (new file — see below)
3. Move `app/(auth)/` → `app/[locale]/(auth)/`
4. Move `app/(app)/` → `app/[locale]/(app)/`
5. Delete the now-empty old directories

**New `app/[locale]/layout.tsx`:**

```tsx
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!routing.locales.includes(locale as 'en' | 'fr')) notFound()

  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
```

**Keep `app/layout.tsx` as the root HTML shell** — it provides `<html>` and `<body>`, but move the `lang` attribute to the locale layout or make it dynamic:

```tsx
// app/layout.tsx — remove lang="en", let [locale]/layout.tsx own it
// OR pass locale down. Simplest: keep lang="en" in root layout as fallback
// and override via [locale]/layout.tsx using generateStaticParams.
```

The simplest approach: keep `<html lang="en">` in root layout (acceptable fallback), locale layout overrides it per-request if needed. This avoids complexity.

---

## Step 7 — Migrate components (in order)

For each component: read the file first, replace hardcoded strings with `t('key')`, do not change any logic or styling.

### 7a — components/auth/SignInForm.tsx
```ts
const t = useTranslations('auth')
// Replace every hardcoded string with t('signInHeading'), t('email'), etc.
```

### 7b — components/auth/SignUpForm.tsx
```ts
const t = useTranslations('auth')
```

### 7c — components/mobile/BottomNav.tsx
```ts
const t = useTranslations('nav')
// "Desks" → t('desks'), etc.
```

### 7d — app/[locale]/(app)/desks/page.tsx (RSC)
```ts
import { getTranslations } from 'next-intl/server'
const t = await getTranslations('desks')
// plural: t('count', { count: desks.length })  ← next-intl handles plurals natively
```

### 7e — components/desk/CreateDeskButton.tsx
```ts
const t = useTranslations('desks')
```

### 7f — components/desk/DeskCard.tsx
```ts
const t = useTranslations('desks')
```

### 7g — components/chat/ExecutionCard.tsx
```ts
const t = useTranslations('agent')
// "Running" → t('toolRunning'), etc.
```

### 7h — components/agent/AgentOverlay.tsx
```ts
const t = useTranslations('agent')
```

### 7i — components/history/VersionList.tsx
```ts
const t = useTranslations('history')
```

### 7j — Metadata in app/[locale]/(app)/desks/page.tsx and root layout
```ts
// RSC pages that export generateMetadata:
export async function generateMetadata() {
  const t = await getTranslations('meta')
  return { title: t('title'), description: t('description') }
}
```

---

## Step 8 — Add language switcher

Create `components/locale/LocaleSwitcher.tsx` (client component):

```tsx
'use client'
import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'

export function LocaleSwitcher() {
  const t = useTranslations('locale')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  function toggle() {
    const next = locale === 'en' ? 'fr' : 'en'
    // Strip current locale prefix if present, then add new one
    const stripped = pathname.replace(/^\/fr/, '') || '/'
    router.push(next === 'fr' ? `/fr${stripped}` : stripped)
  }

  return (
    <button
      onClick={toggle}
      className="text-sm text-white/60 hover:text-white transition-colors px-2 py-1"
    >
      {t('switch')}
    </button>
  )
}
```

Add `<LocaleSwitcher />` to `app/[locale]/(app)/layout.tsx` in the header area (near the top of the page or in BottomNav area).

---

## Step 9 — Verification checklist

Run these in order. Fix any error before moving to the next.

```bash
pnpm lint
pnpm build
pnpm dev -p 3001
```

Manual checks with dev server running:

- [ ] `http://localhost:3001/` redirects to `/desks` (English, no prefix)
- [ ] `http://localhost:3001/fr` redirects to `/fr/desks`
- [ ] `/desks` shows English strings
- [ ] `/fr/desks` shows French strings
- [ ] Language switcher on `/desks` navigates to `/fr/desks` and vice versa
- [ ] `/sign-in` shows English auth form
- [ ] `/fr/sign-in` shows French auth form
- [ ] Signing in from `/fr/sign-in` lands on `/fr/desks`
- [ ] API routes (`/api/health`, `/api/chat/stream`) are unaffected
- [ ] `<html lang>` attribute is `en` on English pages, `fr` on French pages (check DevTools)

---

## Step 10 — Documentation updates

After all checks pass:

1. Update `ADHD.md` — add i18n to "What It Does" section
2. Update `docs/user-flow-tests.md` — add notes to Flow 1 and Flow 2 about `/fr/` prefix, add a language switcher check
3. Update `docs/handoff.md` with what was done and next steps
4. Commit: `feat: add i18n — English and French with next-intl`

---

## Files created/changed summary

| Action | Path |
|--------|------|
| NEW | `messages/en.json` |
| NEW | `messages/fr.json` |
| NEW | `i18n/request.ts` |
| NEW | `i18n/routing.ts` |
| NEW | `app/[locale]/layout.tsx` |
| NEW | `components/locale/LocaleSwitcher.tsx` |
| MOVE | `app/(auth)/` → `app/[locale]/(auth)/` |
| MOVE | `app/(app)/` → `app/[locale]/(app)/` |
| EDIT | `next.config.ts` — wrap with `withNextIntl` |
| EDIT | `middleware.ts` — chain intl + auth |
| EDIT | `components/auth/SignInForm.tsx` |
| EDIT | `components/auth/SignUpForm.tsx` |
| EDIT | `components/mobile/BottomNav.tsx` |
| EDIT | `components/desk/CreateDeskButton.tsx` |
| EDIT | `components/desk/DeskCard.tsx` |
| EDIT | `components/chat/ExecutionCard.tsx` |
| EDIT | `components/agent/AgentOverlay.tsx` |
| EDIT | `components/history/VersionList.tsx` |
| EDIT | `app/[locale]/(app)/desks/page.tsx` |
| EDIT | `docs/handoff.md` |
| EDIT | `ADHD.md` |
| EDIT | `docs/user-flow-tests.md` |

## Key decisions (do not change these)

- **Library:** `next-intl` — not i18next, not lingui
- **Prefix strategy:** `localePrefix: "as-needed"` — English has no prefix, French gets `/fr/`
- **No translation of:** agent prompts, LLM output, DB content, API route paths
- **Plural syntax:** next-intl uses `{count}` interpolation with `_one`/`_other` key suffixes
- **Middleware order:** intl middleware runs first, auth gate runs second
