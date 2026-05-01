---
name: ADHD
description: Generate or update ADHD.md project brain dump - quick status, what it does, what it will do, tech stack, infra, gotchas
---

# ADHD — Living Project Brain Dump

> **Trigger:** Type `ADHD` or `/ADHD` anywhere in Claude Code
> **Effect:** Generates or updates `ADHD.md` in the current project directory (or `~` if no project)

---

## What You Do

When the user says `ADHD` (or runs `/ADHD`), you **generate or update** a file called `ADHD.md`.

- If `ADHD.md` **doesn't exist** → create it fresh from scratch
- If `ADHD.md` **already exists** → read it first, then update/merge — preserve good sections, improve outdated ones

The file lives at the **root of the current project** (or `~/ADHD.md` if not inside a project).

---

## The File You Produce

Write `ADHD.md` using this exact structure. Keep it **short, visual, scannable**. One-liners > paragraphs. Emojis as anchors. No walls of text.

```markdown
# ⚡ [PROJECT NAME] — ADHD.md
> *Last updated: [DATE]*

---

## 🧠 What Is This?
One sentence. What is this thing.

---

## ✅ What It Does (Right Now)
- Bullet 1
- Bullet 2
- Bullet 3

---

## 🚀 What It Will Do
- [ ] Near-term goal
- [ ] Next milestone
- [ ] Stretch goal

---

## 🎯 What We Want
> The north star. One paragraph max. Vibe + purpose.

---

## 🏗️ How It's Built
| Layer | Tech |
|-------|------|
| Frontend | e.g. Next.js 14, Tailwind |
| Backend | e.g. Node, Medusa JS |
| DB | e.g. PostgreSQL, SQLite |
| Auth | e.g. Auth.js |
| Hosting | e.g. Hetzner, Vercel |

---

## 🔧 Systems & Infra
- **Repo:** `github.com/...`
- **Port / URL:** `localhost:XXXX` or `https://...`
- **Deploy:** e.g. Dokploy, Docker, systemd
- **Env:** `.env.local` — key vars: `DATABASE_URL`, `NEXT_PUBLIC_...`

---

## 💻 Code Patterns
- **Folder structure:** `src/app/`, `src/components/`, `src/lib/`
- **State:** e.g. Zustand / React Query / server state
- **API style:** REST / tRPC / GraphQL
- **Key conventions:** e.g. `use server`, route handlers in `/api/`

---

## 🔌 APIs & Integrations
| Service | What For | Key |
|---------|----------|-----|
| Anthropic | AI generation | `ANTHROPIC_API_KEY` |
| Cloudflare R2 | Image storage | `R2_*` |
| ... | ... | ... |

---

## ⚠️ Watch Out
- Known gotcha 1
- Known gotcha 2

---

## 🗒️ Nick's Notes
> Freeform scratch area. Anything worth remembering.
```

---

## Rules

- **Tone:** Casual, direct, Nick-style. No corporate fluff.
- **Length:** Short. If a section has nothing yet → write `_TBD_` or skip it.
- **Context:** Pull everything from the current conversation + any open files. Don't ask — just write.
- **Arguments:** If Nick passes text after `ADHD` (e.g. `ADHD added R2 upload flow`), treat it as a changelog note and prepend it to `Nick's Notes` with the date.
- **Confirm:** After writing, reply with: `✅ ADHD.md updated — [path]`

---

## Example Trigger Phrases That Count

- `ADHD`
- `/ADHD`
- `ADHD we just added the photo gen flow`
- `ADHD update`
