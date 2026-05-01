"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, CircleDashed, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export interface ExecutionCardEvent {
  id: string;
  name: string;
  args: Record<string, unknown>;
  status: "running" | "done" | "error";
  output?: unknown;
}

interface ExecutionCardProps {
  event: ExecutionCardEvent;
}

function formatValue(value: unknown) {
  if (value === undefined) return "";
  return JSON.stringify(value, null, 2);
}

export function ExecutionCard({ event }: ExecutionCardProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("agent");
  const Icon =
    event.status === "done" ? CheckCircle2 : event.status === "error" ? XCircle : CircleDashed;
  const statusLabel =
    event.status === "done" ? t("toolDone") : event.status === "error" ? t("toolError") : t("toolRunning");

  return (
    <div className="rounded-lg border border-white/10 bg-black/25 text-xs text-[--color-foreground]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-[44px] w-full items-center gap-2 px-3 py-2 text-left"
      >
        <Icon
          size={15}
          className={cn(
            "shrink-0",
            event.status === "done" && "text-emerald-400",
            event.status === "error" && "text-red-400",
            event.status === "running" && "animate-spin text-[--color-brand]"
          )}
        />
        <span className="min-w-0 flex-1 truncate font-mono">{event.name}</span>
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase text-[--color-muted-foreground]">
          {statusLabel}
        </span>
        <ChevronDown size={14} className={cn("shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="border-t border-white/10 px-3 py-2">
          <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-[--color-muted-foreground]">
            {formatValue({ args: event.args, output: event.output })}
          </pre>
        </div>
      )}
    </div>
  );
}
