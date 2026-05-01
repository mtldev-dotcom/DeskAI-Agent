import { db } from "@/lib/db/client";
import { resources } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { generateId } from "@/lib/utils";
import type { OpenRouterTool } from "../openrouter-client";

export const skillTools: OpenRouterTool[] = [
  {
    type: "function",
    function: {
      name: "skill.write",
      description: "Create or update a Skill (instruction block injected into future prompts)",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Unique skill identifier (slug)" },
          body: { type: "string", description: "The skill content in markdown" },
          placement: {
            type: "string",
            enum: ["system", "history", "transient"],
            description: "Where to inject this skill in the prompt",
          },
          when: {
            type: "string",
            description: "Condition for when to load this skill (e.g. 'always', 'channel:telegram')",
          },
        },
        required: ["name", "body"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "skill.list",
      description: "List all skills visible in the current workspace",
      parameters: { type: "object", properties: {} },
    },
  },
];

export async function handleSkillTool(
  name: string,
  args: Record<string, unknown>,
  context: { workspaceId: string; userId: string }
): Promise<unknown> {
  const { workspaceId, userId } = context;

  if (name === "skill.list") {
    return db
      .select({ id: resources.id, name: resources.name, layer: resources.layer, metadata: resources.metadata })
      .from(resources)
      .where(and(eq(resources.kind, "skill"), eq(resources.workspaceId, workspaceId), isNull(resources.archivedAt)));
  }

  if (name === "skill.write") {
    const skillName = String(args.name);
    const body = String(args.body);
    const placement = String(args.placement ?? "system");
    const when = args.when ? String(args.when) : null;

    // Upsert at L2 (user layer)
    const existing = await db
      .select({ id: resources.id })
      .from(resources)
      .where(
        and(
          eq(resources.kind, "skill"),
          eq(resources.layer, "L2"),
          eq(resources.workspaceId, workspaceId),
          eq(resources.userId, userId),
          eq(resources.name, skillName)
        )
      )
      .limit(1);

    if (existing[0]) {
      await db
        .update(resources)
        .set({
          content: { body },
          metadata: { placement, when, loaded: "always" },
          updatedAt: new Date(),
        })
        .where(eq(resources.id, existing[0].id));
      return { ok: true, action: "updated", name: skillName };
    }

    await db.insert(resources).values({
      id: generateId(),
      workspaceId,
      userId,
      layer: "L2",
      kind: "skill",
      name: skillName,
      content: { body },
      metadata: { placement, when, loaded: "always" },
    });

    return { ok: true, action: "created", name: skillName };
  }

  throw new Error(`Unknown skill tool: ${name}`);
}
