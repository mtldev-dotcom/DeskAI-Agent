"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState, useTransition } from "react";
import { Bot, ChevronDown, CornerDownLeft, SendHorizontal, Sparkles } from "lucide-react";
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
  const [toolPanelOpen, setToolPanelOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, toolEvents]);

  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;

    element.style.height = "0px";
    element.style.height = `${Math.min(element.scrollHeight, 140)}px`;
  }, [input]);

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

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }

  const assistantMessageIds = new Set(
    messages.filter((message) => message.role === "assistant").map((message) => message.id)
  );
  const activeAssistantId = messages.at(-1)?.role === "assistant" ? messages.at(-1)?.id : null;
  const doneCount = toolEvents.filter((event) => event.status === "done").length;
  const errorCount = toolEvents.filter((event) => event.status === "error").length;
  const runningCount = toolEvents.filter((event) => event.status === "running").length;
  const shouldOpenToolPanel = toolPanelOpen;

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,rgba(87,181,255,0.14),transparent_72%)]" />

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-5 sm:px-5">
        {messages.length === 0 && toolEvents.length === 0 ? (
          <div className="flex min-h-full items-center justify-center py-10">
            <div className="max-w-sm rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-5 text-center shadow-[0_24px_60px_rgba(0,0,0,0.24)]">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/12 text-cyan-200">
                <Sparkles size={20} />
              </div>
              <h3 className="text-sm font-semibold text-white/92">Start with a clear ask</h3>
              <p className="mt-2 text-sm leading-6 text-[--color-muted-foreground]">
                Ask the agent to create widgets, reorganize this desk, or debug something already on screen.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                role={message.role}
                text={message.text}
                isStreaming={message.id === activeAssistantId && assistantMessageIds.has(message.id) && isPending}
              />
            ))}

            {toolEvents.length > 0 && (
              <section className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => setToolPanelOpen((current) => !current)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.025] px-3 py-3 text-left transition-colors hover:bg-white/[0.04]"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-cyan-200">
                    <Bot size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
                      Agent activity
                    </div>
                    <div className="text-xs text-[--color-muted-foreground]">
                      {toolEvents.length} tool events in this thread
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-emerald-400/15 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                      {doneCount} done
                    </span>
                    {errorCount > 0 && (
                      <span className="rounded-full border border-red-400/15 bg-red-400/10 px-2 py-0.5 text-[10px] font-medium text-red-300">
                        {errorCount} error
                      </span>
                    )}
                    {runningCount > 0 && (
                      <span className="rounded-full border border-cyan-400/15 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-200">
                        {runningCount} running
                      </span>
                    )}
                    <ChevronDown
                      size={15}
                      className={cn("shrink-0 text-white/55 transition-transform", shouldOpenToolPanel && "rotate-180")}
                    />
                  </div>
                </button>

                {shouldOpenToolPanel ? (
                  <div className="space-y-2.5">
                    <div className="max-h-56 space-y-2.5 overflow-y-auto pr-1">
                      {toolEvents
                        .slice()
                        .reverse()
                        .map((event) => (
                          <ExecutionCard key={event.id} event={event} compact />
                        ))}
                    </div>
                  </div>
                ) : null}
              </section>
            )}
          </div>
        )}
      </div>

      <form
        onSubmit={sendMessage}
        className="border-t border-white/10 bg-[linear-gradient(180deg,rgba(8,10,18,0.24),rgba(8,10,18,0.92))] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl sm:px-5"
      >
        <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.045] p-2 shadow-[0_20px_40px_rgba(0,0,0,0.25)]">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Message agent"
              className="max-h-[140px] min-h-[48px] flex-1 resize-none bg-transparent px-3 py-3 text-[15px] leading-6 text-[--color-foreground] outline-none placeholder:text-[--color-muted-foreground]"
            />
            <button
              type="submit"
              disabled={isPending || !input.trim()}
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(110,214,255,1),rgba(89,123,255,1))] text-slate-950 shadow-[0_12px_30px_rgba(87,181,255,0.3)] transition-all",
                (isPending || !input.trim()) && "scale-95 opacity-45 shadow-none"
              )}
              aria-label="Send"
            >
              <SendHorizontal size={18} />
            </button>
          </div>
          <div className="flex items-center justify-between px-3 pb-1 pt-1.5 text-[11px] text-[--color-muted-foreground]">
            <span>Ask for widgets, edits, or desk actions</span>
            <span className="inline-flex items-center gap-1">
              <CornerDownLeft size={12} />
              Enter to send
            </span>
          </div>
        </div>
      </form>
    </div>
  );
}
