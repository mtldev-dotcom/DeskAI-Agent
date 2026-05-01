"use client";

import { FormEvent, useEffect, useRef, useState, useTransition } from "react";
import { SendHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn, generateId } from "@/lib/utils";
import { ExecutionCard, type ExecutionCardEvent } from "./ExecutionCard";
import { MessageBubble } from "./MessageBubble";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

interface ChatStreamProps {
  deskId: string;
}

type StreamEvent =
  | { type: "delta"; text: string }
  | (ExecutionCardEvent & { type: "tool_call" | "tool_result" })
  | { type: "error"; error: string }
  | { type: "done" };

function mergeToolEvent(events: ExecutionCardEvent[], event: ExecutionCardEvent) {
  const index = events.findIndex((item) => item.id === event.id);
  if (index === -1) return [...events, event];
  return events.map((item, itemIndex) => (itemIndex === index ? { ...item, ...event } : item));
}

function shouldRefreshDesk(event: ExecutionCardEvent) {
  return (
    event.status === "done" &&
    (event.name.startsWith("widget.") || event.name === "desk.patch" || event.name === "desk.create")
  );
}

function dispatchSandboxExec(event: ExecutionCardEvent) {
  if (event.status !== "done") return;
  if (typeof event.output !== "object" || event.output === null) return;
  const output = event.output as { type?: unknown; code?: unknown; widgetInstanceId?: unknown };
  if (output.type !== "sandbox_exec" || typeof output.code !== "string") return;

  window.dispatchEvent(
    new CustomEvent("desksai:sandbox-exec", {
      detail: {
        code: output.code,
        widgetInstanceId: typeof output.widgetInstanceId === "string" ? output.widgetInstanceId : null,
      },
    })
  );
}

export function ChatStream({ deskId }: ChatStreamProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [toolEvents, setToolEvents] = useState<ExecutionCardEvent[]>([]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, toolEvents]);

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      const response = await fetch(`/api/chat/history?deskId=${encodeURIComponent(deskId)}`);
      if (!response.ok) return;

      const history = (await response.json()) as {
        messages: ChatMessage[];
        toolEvents: ExecutionCardEvent[];
      };

      if (!cancelled) {
        setMessages(history.messages.filter((message) => message.role === "user" || message.role === "assistant"));
        setToolEvents(
          history.toolEvents.filter(
            (event) => event.status === "running" || event.status === "done" || event.status === "error"
          )
        );
      }
    }

    loadHistory().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [deskId]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text || isPending) return;

    const assistantId = generateId();
    setInput("");
    setMessages((current) => [
      ...current,
      { id: generateId(), role: "user", text },
      { id: assistantId, role: "assistant", text: "" },
    ]);

    startTransition(async () => {
      try {
        const response = await fetch("/api/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deskId, text, channel: "web" }),
        });

        if (!response.ok || !response.body) {
          throw new Error(await response.text());
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() ?? "";

          for (const chunk of chunks) {
            const line = chunk.split("\n").find((item) => item.startsWith("data: "));
            if (!line) continue;

            const payload = JSON.parse(line.slice(6)) as StreamEvent;
            if (payload.type === "delta") {
              setMessages((current) =>
                current.map((message) =>
                  message.id === assistantId
                    ? { ...message, text: message.text + payload.text }
                    : message
                )
              );
            }

            if (payload.type === "tool_call" || payload.type === "tool_result") {
              setToolEvents((current) => mergeToolEvent(current, payload));
              if (payload.type === "tool_result") {
                dispatchSandboxExec(payload);
              }
              if (payload.type === "tool_result" && shouldRefreshDesk(payload)) {
                router.refresh();
              }
            }

            if (payload.type === "error") {
              setMessages((current) =>
                current.map((message) =>
                  message.id === assistantId
                    ? { ...message, text: message.text || payload.error }
                    : message
                )
              );
            }
          }
        }
      } catch (error) {
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId
              ? { ...message, text: error instanceof Error ? error.message : String(error) }
              : message
          )
        );
      }
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {messages.map((message) => (
          <MessageBubble key={message.id} role={message.role} text={message.text} />
        ))}
        {toolEvents.map((event) => (
          <ExecutionCard key={event.id} event={event} />
        ))}
      </div>

      <form onSubmit={sendMessage} className="flex gap-2 border-t border-white/10 p-3">
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={1}
          placeholder="Message agent"
          className="min-h-[44px] flex-1 resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[--color-foreground] outline-none placeholder:text-[--color-muted-foreground] focus:border-white/20"
        />
        <button
          type="submit"
          disabled={isPending || !input.trim()}
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[--color-brand] text-[--color-brand-foreground] transition-opacity",
            (isPending || !input.trim()) && "opacity-50"
          )}
          aria-label="Send"
        >
          <SendHorizontal size={18} />
        </button>
      </form>
    </div>
  );
}
