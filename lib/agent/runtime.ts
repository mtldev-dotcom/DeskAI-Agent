import { db } from "@/lib/db/client";
import { resources, widgetInstances } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import {
  appendAssistantMessage,
  appendToolCall,
  appendUserMessage,
  getOrCreateConversation,
  getRecentMessages,
} from "./conversation-store";
import { formatMemoriesForPrompt, getMemories } from "./memory-store";
import type { ChatMessage, OpenRouterToolCall } from "./openrouter-client";
import { streamChat } from "./openrouter-client";
import { buildPrompt } from "./prompt-builder";
import { loadSkills } from "./skills-loader";
import { dispatchTool, openRouterTools, publicToolName } from "./tools";

export interface AgentToolEvent {
  id: string;
  name: string;
  args: Record<string, unknown>;
  status: "running" | "done" | "error";
  output?: unknown;
}

export interface RunAgentInput {
  userId: string;
  workspaceId: string;
  deskId: string | null;
  channel: "web" | "telegram" | "admin";
  text: string;
  onDelta?: (text: string) => void | Promise<void>;
  onToolCall?: (event: AgentToolEvent) => void | Promise<void>;
}

interface DeskContent {
  systemPrompt?: string;
  model?: string;
}

function parseToolArgs(raw: string): Record<string, unknown> {
  if (!raw.trim()) return {};
  const parsed: unknown = JSON.parse(raw);
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    return parsed as Record<string, unknown>;
  }
  return {};
}

function toolMessage(callId: string, output: unknown): ChatMessage {
  return {
    role: "tool",
    tool_call_id: callId,
    content: JSON.stringify(output),
  };
}

export async function runAgent(input: RunAgentInput) {
  const conversationId = await getOrCreateConversation({
    deskId: input.deskId,
    userId: input.userId,
    workspaceId: input.workspaceId,
    channel: input.channel,
  });

  await appendUserMessage(conversationId, input.text);

  const [desk] = input.deskId
    ? await db
        .select()
        .from(resources)
        .where(
          and(
            eq(resources.id, input.deskId),
            eq(resources.workspaceId, input.workspaceId),
            eq(resources.kind, "desk"),
            isNull(resources.archivedAt)
          )
        )
        .limit(1)
    : [];

  const widgets = input.deskId
    ? await db
        .select()
        .from(widgetInstances)
        .where(eq(widgetInstances.deskId, input.deskId))
    : [];

  const activeWidgetTypes = widgets
    .map((widget) => (widget.props as { type?: unknown }).type)
    .filter((type): type is string => typeof type === "string");
  const deskContent = (desk?.content ?? {}) as DeskContent;
  const skills = await loadSkills(input.workspaceId, input.userId, {
    deskId: input.deskId ?? undefined,
    channel: input.channel,
    activeWidgetTypes,
  });
  const memories = await getMemories(input.workspaceId, input.userId, "persistent");
  const history = await getRecentMessages(conversationId);

  const messages = buildPrompt({
    deskSystemPrompt: deskContent.systemPrompt,
    skills,
    persistentMemories: formatMemoriesForPrompt(memories),
    history,
    userText: input.text,
    channel: input.channel,
    deskName: desk?.name,
    activeWidgetTypes,
  });

  let assistantText = "";
  const toolEvents: Array<AgentToolEvent & { callId: string }> = [];

  for (let round = 0; round < 4; round++) {
    const toolCalls: OpenRouterToolCall[] = [];

    for await (const event of streamChat(messages, openRouterTools, {
      model: deskContent.model,
    })) {
      if (event.type === "text") {
        assistantText += event.text;
        await input.onDelta?.(event.text);
      }

      if (event.type === "tool_call") {
        toolCalls.push({
          id: event.id,
          type: "function",
          function: {
            name: publicToolName(event.name),
            arguments: event.arguments,
          },
        });
      }
    }

    if (!toolCalls.length) break;

    messages.push({
      role: "assistant",
      content: assistantText,
      tool_calls: toolCalls,
    });

    for (const toolCall of toolCalls) {
      const name = publicToolName(toolCall.function.name);
      let args: Record<string, unknown> = {};
      try {
        args = parseToolArgs(toolCall.function.arguments);
      } catch (error) {
        args = { parseError: error instanceof Error ? error.message : String(error) };
      }

      const running: AgentToolEvent & { callId: string } = {
        id: toolCall.id,
        callId: toolCall.id,
        name,
        args,
        status: "running",
      };
      await input.onToolCall?.(running);

      try {
        const output = args.parseError
          ? { ok: false, error: args.parseError }
          : await dispatchTool(name, args, {
              workspaceId: input.workspaceId,
              userId: input.userId,
              deskId: input.deskId,
            });
        const done = { ...running, status: "done" as const, output };
        toolEvents.push(done);
        messages.push(toolMessage(toolCall.id, output));
        await input.onToolCall?.(done);
      } catch (error) {
        const output = { ok: false, error: error instanceof Error ? error.message : String(error) };
        const failed = { ...running, status: "error" as const, output };
        toolEvents.push(failed);
        messages.push(toolMessage(toolCall.id, output));
        await input.onToolCall?.(failed);
      }
    }
  }

  const assistantMessageId = await appendAssistantMessage(conversationId, assistantText);
  for (const event of toolEvents) {
    await appendToolCall(
      assistantMessageId,
      event.name,
      event.args,
      event.output ?? null,
      event.status === "error" ? "error" : "done"
    );
  }

  return { conversationId, text: assistantText, toolCalls: toolEvents };
}
