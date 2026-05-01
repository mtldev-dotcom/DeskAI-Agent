import { writeMemory, getMemories } from "@/lib/agent/memory-store";
import type { OpenRouterTool } from "../openrouter-client";

export const memoryTools: OpenRouterTool[] = [
  {
    type: "function",
    function: {
      name: "memory.write",
      description: "Store a fact or preference to remember for future conversations",
      parameters: {
        type: "object",
        properties: {
          text: { type: "string", description: "What to remember" },
          kind: {
            type: "string",
            enum: ["persistent", "transient"],
            description: "persistent = remembered forever; transient = current session only",
          },
        },
        required: ["text"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "memory.list",
      description: "List stored memories",
      parameters: {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["persistent", "transient"] },
        },
      },
    },
  },
];

export async function handleMemoryTool(
  name: string,
  args: Record<string, unknown>,
  context: { workspaceId: string; userId: string }
): Promise<unknown> {
  const { workspaceId, userId } = context;

  if (name === "memory.write") {
    const kind = args.kind === "transient" ? "transient" : "persistent";
    await writeMemory(workspaceId, userId, String(args.text), kind);
    return { ok: true, kind };
  }

  if (name === "memory.list") {
    const kind = args.kind as "persistent" | "transient" | undefined;
    const memories = await getMemories(workspaceId, userId, kind);
    return memories.map((m) => ({ text: m.text, kind: m.kind }));
  }

  throw new Error(`Unknown memory tool: ${name}`);
}
