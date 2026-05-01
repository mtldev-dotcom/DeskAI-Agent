import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { requireWorkspace } from "@/lib/auth/workspace";
import { db } from "@/lib/db/client";
import { conversations, messages, toolCalls } from "@/lib/db/schema";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const deskId = searchParams.get("deskId");

  if (!deskId) {
    return NextResponse.json({ error: "deskId is required" }, { status: 400 });
  }

  const { userId, workspaceId } = await requireWorkspace();
  const [conversation] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(
      and(
        eq(conversations.deskId, deskId),
        eq(conversations.userId, userId),
        eq(conversations.workspaceId, workspaceId),
        eq(conversations.channel, "web")
      )
    )
    .orderBy(asc(conversations.createdAt))
    .limit(1);

  if (!conversation) {
    return NextResponse.json({ messages: [], toolEvents: [] });
  }

  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversation.id))
    .orderBy(asc(messages.createdAt));

  const messageRows = rows.map((message) => {
    const content = message.content as { text?: string };
    return {
      id: message.id,
      role: message.role,
      text: content.text ?? "",
    };
  });

  const assistantIds = rows.filter((message) => message.role === "assistant").map((message) => message.id);
  const toolEvents = [];

  for (const messageId of assistantIds) {
    const calls = await db
      .select()
      .from(toolCalls)
      .where(eq(toolCalls.messageId, messageId))
      .orderBy(asc(toolCalls.startedAt));

    for (const call of calls) {
      toolEvents.push({
        id: call.id,
        name: call.name,
        args: call.args,
        status: call.status,
        output: call.output,
      });
    }
  }

  return NextResponse.json({ messages: messageRows, toolEvents });
}
