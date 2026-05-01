import { db } from "@/lib/db/client";
import { resources } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { generateId, slugify } from "@/lib/utils";
import type { OpenRouterTool } from "../openrouter-client";

export const deskTools: OpenRouterTool[] = [
  {
    type: "function",
    function: {
      name: "desk.create",
      description: "Create a new Desk in the current workspace",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Display name for the Desk" },
          systemPrompt: { type: "string", description: "Optional system prompt for this Desk's agent context" },
          model: { type: "string", description: "LLM model to use (default: anthropic/claude-sonnet-4-6)" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "desk.patch",
      description: "Update an existing Desk's name, system prompt, or model",
      parameters: {
        type: "object",
        properties: {
          deskId: { type: "string" },
          name: { type: "string" },
          systemPrompt: { type: "string" },
          model: { type: "string" },
        },
        required: ["deskId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "desk.list",
      description: "List all Desks in the current workspace",
      parameters: { type: "object", properties: {} },
    },
  },
];

export async function handleDeskTool(
  name: string,
  args: Record<string, unknown>,
  context: { workspaceId: string; userId: string }
): Promise<unknown> {
  const { workspaceId, userId } = context;

  if (name === "desk.list") {
    return db
      .select({ id: resources.id, name: resources.name, updatedAt: resources.updatedAt })
      .from(resources)
      .where(and(eq(resources.kind, "desk"), eq(resources.workspaceId, workspaceId), isNull(resources.archivedAt)));
  }

  if (name === "desk.create") {
    const deskName = String(args.name);
    const id = generateId();
    const [desk] = await db
      .insert(resources)
      .values({
        id,
        workspaceId,
        userId,
        layer: "L1",
        kind: "desk",
        name: deskName,
        content: {
          widgetIds: [],
          systemPrompt: String(args.systemPrompt ?? ""),
          model: String(args.model ?? process.env.OPENROUTER_DEFAULT_MODEL ?? "anthropic/claude-sonnet-4-6"),
        },
        metadata: {},
      })
      .returning();
    return { id: desk.id, name: desk.name, url: `/desks/${desk.id}` };
  }

  if (name === "desk.patch") {
    const deskId = String(args.deskId);
    const [existing] = await db
      .select()
      .from(resources)
      .where(and(eq(resources.id, deskId), eq(resources.workspaceId, workspaceId)))
      .limit(1);

    if (!existing) throw new Error(`Desk ${deskId} not found`);

    const currentContent = existing.content as Record<string, unknown>;
    const updatedContent = {
      ...currentContent,
      ...(args.systemPrompt !== undefined ? { systemPrompt: String(args.systemPrompt) } : {}),
      ...(args.model !== undefined ? { model: String(args.model) } : {}),
    };

    await db
      .update(resources)
      .set({
        ...(args.name ? { name: String(args.name) } : {}),
        content: updatedContent,
        updatedAt: new Date(),
      })
      .where(eq(resources.id, deskId));

    return { ok: true, deskId };
  }

  throw new Error(`Unknown desk tool: ${name}`);
}
