import { db } from "@/lib/db/client";
import { resources } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { generateId } from "@/lib/utils";

interface MemoryContent {
  text: string;
  kind: "persistent" | "transient";
  createdAt?: string;
}

export async function getMemories(
  workspaceId: string,
  userId: string,
  kind?: "persistent" | "transient"
): Promise<MemoryContent[]> {
  const rows = await db
    .select()
    .from(resources)
    .where(
      and(
        eq(resources.kind, "memory"),
        eq(resources.workspaceId, workspaceId),
        eq(resources.userId, userId),
        eq(resources.enabled, true),
        isNull(resources.archivedAt)
      )
    )
    .orderBy(resources.createdAt);

  const memories = rows.map((r) => r.content as MemoryContent);
  if (kind) return memories.filter((m) => m.kind === kind);
  return memories;
}

export async function writeMemory(
  workspaceId: string,
  userId: string,
  text: string,
  kind: "persistent" | "transient" = "persistent"
): Promise<void> {
  await db.insert(resources).values({
    id: generateId(),
    workspaceId,
    userId,
    layer: "L2",
    kind: "memory",
    name: `memory-${Date.now()}`,
    content: { text, kind, createdAt: new Date().toISOString() },
    metadata: {},
    enabled: true,
  });
}

export async function clearTransientMemories(
  workspaceId: string,
  userId: string
): Promise<void> {
  const rows = await db
    .select({ id: resources.id, content: resources.content })
    .from(resources)
    .where(
      and(
        eq(resources.kind, "memory"),
        eq(resources.workspaceId, workspaceId),
        eq(resources.userId, userId),
        isNull(resources.archivedAt)
      )
    );

  for (const row of rows) {
    const content = row.content as MemoryContent;
    if (content.kind === "transient") {
      await db
        .update(resources)
        .set({ archivedAt: new Date() })
        .where(eq(resources.id, row.id));
    }
  }
}

export function formatMemoriesForPrompt(memories: MemoryContent[]): string {
  if (!memories.length) return "";
  const lines = memories.map((m) => `- ${m.text}`).join("\n");
  return `## Memories\n\n${lines}`;
}
