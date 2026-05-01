"use client";

import { cn } from "@/lib/utils";
import { MarkdownPatcher } from "./MarkdownPatcher";

interface MessageBubbleProps {
  role: "user" | "assistant";
  text: string;
}

export function MessageBubble({ role, text }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[86%] rounded-xl px-3 py-2 text-sm",
          isUser
            ? "bg-[--color-brand] text-[--color-brand-foreground]"
            : "bg-white/5 text-[--color-foreground] border border-white/10"
        )}
      >
        <MarkdownPatcher text={text} />
      </div>
    </div>
  );
}
