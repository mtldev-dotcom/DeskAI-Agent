"use client";

import { cn } from "@/lib/utils";
import { MarkdownPatcher } from "./MarkdownPatcher";

interface MessageBubbleProps {
  role: "user" | "assistant";
  text: string;
  isStreaming?: boolean;
}

export function MessageBubble({ role, text, isStreaming }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("flex max-w-[90%] flex-col gap-2 sm:max-w-[86%]", isUser && "items-end")}>
        <span
          className={cn(
            "px-1 text-[10px] font-medium uppercase tracking-[0.22em]",
            isUser ? "text-cyan-200/70" : "text-white/38"
          )}
        >
          {isUser ? "You" : "Agent"}
        </span>
        <div
          className={cn(
            "relative overflow-hidden rounded-[1.35rem] px-4 py-3 text-[14px] leading-7 shadow-[0_18px_40px_rgba(0,0,0,0.24)]",
            isUser
              ? "rounded-br-md bg-[linear-gradient(135deg,rgba(112,214,255,0.96),rgba(90,126,255,0.92))] text-slate-950"
              : "rounded-bl-md border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] text-[--color-foreground]"
          )}
        >
          {!isUser && (
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(120,200,255,0.12),transparent_45%)]" />
          )}
          <div className="relative">
            <MarkdownPatcher text={text} />
            {isStreaming && !isUser && (
              <span className="ml-1 inline-block h-4 w-2 animate-pulse rounded-full bg-cyan-200/70 align-[-2px]" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
