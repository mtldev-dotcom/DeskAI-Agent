import { db } from "@/lib/db/client";
import { conversations, messages, toolCalls } from "@/lib/db/schema";
import { and, eq, asc } from "drizzle-orm";
import { generateId } from "@/lib/utils";
import type { ChatMessage } from "./openrouter-client";

export async function getOrCreateConversation(params: {
  deskId: string | null;
  userId: string;
  workspaceId: string;
  channel: "web" | "telegram" | "admin";
}): Promise<string> {
  // For web/admin: one active conversation per desk per user
  if (params.deskId && params.channel !== "telegram") {
    const existing = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(
        and(
          eq(conversations.deskId, params.deskId),
          eq(conversations.userId, params.userId),
          eq(conversations.channel, params.channel)
        )
      )
      .orderBy(asc(conversations.createdAt))
      .limit(1);

    if (existing[0]) return existing[0].id;
  }

  const id = generateId();
  await db.insert(conversations).values({
    id,
    deskId: params.deskId,
    userId: params.userId,
    workspaceId: params.workspaceId,
    channel: params.channel,
  });
  return id;
}

export async function getRecentMessages(
  conversationId: string,
  limit = 40
): Promise<ChatMessage[]> {
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt))
    .limit(limit);

  return rows.map((r) => {
    const content = r.content as { text?: string; parts?: unknown[] };
    return {
      role: r.role as "user" | "assistant" | "system",
      content: content.text ?? (Array.isArray(content.parts) ? content.parts.join("") : ""),
    };
  });
}

export async function appendUserMessage(
  conversationId: string,
  text: string
): Promise<string> {
  const id = generateId();
  await db.insert(messages).values({
    id,
    conversationId,
    role: "user",
    content: { text },
  });
  return id;
}

export async function appendAssistantMessage(
  conversationId: string,
  text: string,
  tokens?: number
): Promise<string> {
  const id = generateId();
  await db.insert(messages).values({
    id,
    conversationId,
    role: "assistant",
    content: { text },
    tokens,
  });
  return id;
}

export async function appendToolCall(
  messageId: string,
  name: string,
  args: Record<string, unknown>,
  output: unknown,
  status: "done" | "error" = "done"
): Promise<void> {
  await db.insert(toolCalls).values({
    id: generateId(),
    messageId,
    name,
    args,
    status,
    output: output as Record<string, unknown>,
    startedAt: new Date(),
    finishedAt: new Date(),
  });
}
