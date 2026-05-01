export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | MessageContentPart[];
  tool_call_id?: string;
  tool_calls?: OpenRouterToolCall[];
}

export interface MessageContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string };
}

export interface OpenRouterTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface OpenRouterToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export interface StreamDelta {
  type: "text";
  text: string;
}

export interface ToolCallDelta {
  type: "tool_call";
  id: string;
  name: string;
  arguments: string;
}

export type StreamEvent = StreamDelta | ToolCallDelta | { type: "done" };

interface OpenRouterOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  apiKey?: string;
}

const DEFAULT_MODEL = "anthropic/claude-sonnet-4-6";

/**
 * Streams a chat completion from OpenRouter.
 * Yields StreamEvent objects as they arrive.
 */
export async function* streamChat(
  messages: ChatMessage[],
  tools: OpenRouterTool[] = [],
  opts: OpenRouterOptions = {}
): AsyncGenerator<StreamEvent> {
  const apiKey = opts.apiKey ?? process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");

  const model = opts.model ?? process.env.OPENROUTER_DEFAULT_MODEL ?? DEFAULT_MODEL;

  const body: Record<string, unknown> = {
    model,
    messages,
    stream: true,
    max_tokens: opts.maxTokens ?? 4096,
    temperature: opts.temperature ?? 0.7,
  };

  if (tools.length) {
    body.tools = tools;
    body.tool_choice = "auto";
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://desksai.app",
      "X-Title": "DesksAI",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${text}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  // Track in-progress tool calls across chunks
  const pendingToolCalls: Map<number, { id: string; name: string; args: string }> = new Map();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === "data: [DONE]") continue;
      if (!trimmed.startsWith("data: ")) continue;

      let chunk: Record<string, unknown>;
      try {
        chunk = JSON.parse(trimmed.slice(6));
      } catch {
        continue;
      }

      const choices = chunk.choices as Array<Record<string, unknown>> | undefined;
      if (!choices?.length) continue;

      const delta = choices[0].delta as Record<string, unknown> | undefined;
      if (!delta) continue;

      // Text delta
      if (typeof delta.content === "string" && delta.content) {
        yield { type: "text", text: delta.content };
      }

      // Tool call deltas (may arrive across multiple chunks)
      if (Array.isArray(delta.tool_calls)) {
        for (const tc of delta.tool_calls as Array<Record<string, unknown>>) {
          const idx = tc.index as number;
          if (!pendingToolCalls.has(idx)) {
            pendingToolCalls.set(idx, {
              id: (tc.id as string) ?? "",
              name: ((tc.function as Record<string, string> | undefined)?.name) ?? "",
              args: "",
            });
          }
          const pending = pendingToolCalls.get(idx)!;
          if (tc.id) pending.id = tc.id as string;
          const fn = tc.function as Record<string, string> | undefined;
          if (fn?.name) pending.name = fn.name;
          if (fn?.arguments) pending.args += fn.arguments;
        }
      }

      // Emit completed tool calls when finish_reason === 'tool_calls'
      const finishReason = choices[0].finish_reason as string | null;
      if (finishReason === "tool_calls") {
        for (const [, tc] of pendingToolCalls) {
          yield { type: "tool_call", id: tc.id, name: tc.name, arguments: tc.args };
        }
        pendingToolCalls.clear();
      }
    }
  }

  // Emit any remaining pending tool calls (some models send finish_reason in last chunk)
  for (const [, tc] of pendingToolCalls) {
    yield { type: "tool_call", id: tc.id, name: tc.name, arguments: tc.args };
  }

  yield { type: "done" };
}
