/**
 * Seeds L0 firmware layer: default skills, builtin widget definitions, and onboarding template.
 * Safe to re-run — uses upsert on name.
 */
import "./load-env";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { resources } from "../lib/db/schema";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "crypto";

function requireDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");
  return databaseUrl;
}

const client = postgres(requireDatabaseUrl(), { max: 1 });
const db = drizzle(client);

async function upsertL0(
  kind: "skill" | "widget" | "onboarding_template",
  name: string,
  content: object,
  metadata: object = {}
) {
  const existing = await db
    .select({ id: resources.id })
    .from(resources)
    .where(and(eq(resources.layer, "L0"), eq(resources.kind, kind), eq(resources.name, name)))
    .limit(1);

  if (existing[0]) {
    await db
      .update(resources)
      .set({ content, metadata, updatedAt: new Date() })
      .where(eq(resources.id, existing[0].id));
    console.log(`  updated L0 ${kind}:${name}`);
  } else {
    await db.insert(resources).values({
      id: randomUUID(),
      layer: "L0",
      kind,
      name,
      content,
      metadata,
      workspaceId: null,
      userId: null,
    });
    console.log(`  created L0 ${kind}:${name}`);
  }
}

// ─── L0 Skills ─────────────────────────────────────────────────────────────

async function main() {
await upsertL0(
  "skill",
  "core-agent-behavior",
  {
    body: `You are the DesksAI Agent. You help users build and manage their Desks — interactive workspaces containing widgets.

You can:
- Create and edit Desks
- Add, update, and remove widgets from Desks
- Write and update Skills (this skill system)
- Store and retrieve memories
- Browse the web via the Browser widget
- Execute sandboxed JavaScript
- Explain what you're doing at each step

Always confirm destructive actions before proceeding. When building UI, keep it minimal and focused.`,
  },
  {
    placement: "system",
    loaded: "always",
    when: null,
  }
);

await upsertL0(
  "skill",
  "desk-builder",
  {
    body: `When a user asks you to build something on their Desk:

1. Think about what widgets are needed
2. Use desk.create or widget.add tool calls
3. For custom visualisations, use the iframe widget type (see sandbox API below)
4. Always confirm the widget name and placement with the user
5. After building, briefly explain what was created and how to interact with it

Built-in widget types: markdown, kanban, browser, code, chart, form, iframe, todo, richtext, whiteboard

For interactive custom widgets that don't fit a builtin type, use type "iframe":
- props.html: the full HTML body markup (no <html>/<body> wrapper, just inner content)
- props.script: JavaScript that runs in the sandbox context

The sandbox exposes window.DesksAI:
- DesksAI.props — current persisted props object (read-only)
- DesksAI.widget.patch(newProps) — merges and persists props, returns Promise
- DesksAI.desk.read() — returns current desk + widget metadata
- DesksAI.console.log(...args) — safe logging

Keep iframe widgets self-contained. Use transparent backgrounds. Prefer CSS custom properties for theming.`,
  },
  {
    placement: "system",
    loaded: "always",
    when: null,
  }
);

await upsertL0(
  "skill",
  "memory-guidelines",
  {
    body: `Persistent memory: use memory.write when the user tells you something they'll want you to remember long-term (preferences, names, context).

Transient memory: use for ephemeral context that only matters within the current session (e.g. "the user is currently debugging X").

Never store sensitive information (passwords, full API keys) in memory.`,
  },
  {
    placement: "system",
    loaded: "always",
    when: null,
  }
);

// ─── L0 Builtin Widget Definitions ─────────────────────────────────────────

const builtinWidgets = [
  {
    name: "markdown",
    content: {
      type: "markdown",
      label: "Markdown",
      description: "Render rich markdown content",
      defaultProps: { content: "# Hello\n\nEdit this widget's content." },
      defaultLayout: { w: 6, h: 4 },
    },
  },
  {
    name: "kanban",
    content: {
      type: "kanban",
      label: "Kanban",
      description: "A drag-and-drop kanban board",
      defaultProps: {
        columns: [
          { id: "todo", title: "To Do", cards: [] },
          { id: "doing", title: "In Progress", cards: [] },
          { id: "done", title: "Done", cards: [] },
        ],
      },
      defaultLayout: { w: 12, h: 8 },
    },
  },
  {
    name: "browser",
    content: {
      type: "browser",
      label: "Browser",
      description: "In-app web browser (iframe + headless fallback)",
      defaultProps: { url: "https://example.com" },
      defaultLayout: { w: 8, h: 10 },
    },
  },
  {
    name: "code",
    content: {
      type: "code",
      label: "Code",
      description: "Syntax-highlighted code viewer",
      defaultProps: { language: "typescript", code: "" },
      defaultLayout: { w: 6, h: 6 },
    },
  },
  {
    name: "chart",
    content: {
      type: "chart",
      label: "Chart",
      description: "Data visualisation (recharts)",
      defaultProps: { chartType: "bar", data: [], xKey: "x", yKey: "y" },
      defaultLayout: { w: 6, h: 5 },
    },
  },
  {
    name: "form",
    content: {
      type: "form",
      label: "Form",
      description: "Data entry form with schema-defined fields",
      defaultProps: { fields: [] },
      defaultLayout: { w: 6, h: 6 },
    },
  },
  {
    name: "iframe",
    content: {
      type: "iframe",
      label: "iFrame",
      description: "Sandboxed custom HTML/JS renderer",
      defaultProps: { html: "<p>Custom widget</p>", script: "" },
      defaultLayout: { w: 6, h: 6 },
    },
  },
  {
    name: "todo",
    content: {
      type: "todo",
      label: "Todo List",
      description: "Interactive checklist with persistent state",
      defaultProps: {
        items: [
          { id: "1", text: "First task", done: false },
          { id: "2", text: "Second task", done: false },
        ],
      },
      defaultLayout: { w: 6, h: 7 },
    },
  },
  {
    name: "richtext",
    content: {
      type: "richtext",
      label: "Rich Text",
      description: "WYSIWYG text editor with auto-save",
      defaultProps: { html: "<p>Start writing here…</p>" },
      defaultLayout: { w: 6, h: 7 },
    },
  },
  {
    name: "whiteboard",
    content: {
      type: "whiteboard",
      label: "Whiteboard",
      description: "Freehand drawing canvas (tldraw)",
      defaultProps: { snapshot: null },
      defaultLayout: { w: 8, h: 10 },
    },
  },
];

for (const w of builtinWidgets) {
  await upsertL0("widget", w.name, w.content);
}

// ─── L0 Onboarding Template ─────────────────────────────────────────────────

await upsertL0(
  "onboarding_template",
  "default-onboarding",
  {
    widgetIds: [],
    systemPrompt:
      "You are the DesksAI Agent. Welcome the user, explain what Desks are, and offer to build their first widget.",
    model: "anthropic/claude-sonnet-4-6",
    welcomeWidgets: [
      {
        type: "markdown",
        name: "welcome",
        props: {
          content:
            "# Welcome to DesksAI 👋\n\nThis is your **Welcome Desk**. You can chat with your agent below to build widgets, track tasks, browse the web, and more.\n\nTry saying: *\"Build me a habit tracker\"*",
        },
        layout: { x: 0, y: 0, w: 12, h: 4 },
      },
    ],
  }
);

console.log("Seed complete.");
await client.end();
}

main().catch(async (error) => {
  console.error(error);
  await client.end();
  process.exit(1);
});
