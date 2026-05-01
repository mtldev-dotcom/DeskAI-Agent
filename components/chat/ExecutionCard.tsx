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
  compact?: boolean;
}

function formatValue(value: unknown) {
  if (value === undefined) return "";
  return JSON.stringify(value, null, 2);
}

export function ExecutionCard({ event, compact }: ExecutionCardProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("agent");
  const Icon =
    event.status === "done" ? CheckCircle2 : event.status === "error" ? XCircle : CircleDashed;
  const statusLabel =
    event.status === "done" ? t("toolDone") : event.status === "error" ? t("toolError") : t("toolRunning");

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] text-xs text-[--color-foreground] shadow-[0_14px_36px_rgba(0,0,0,0.18)]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex w-full items-center gap-3 text-left transition-colors hover:bg-white/[0.03]",
          compact ? "min-h-[50px] px-3.5 py-2.5" : "min-h-[58px] px-4 py-3"
        )}
      >
        <Icon
          size={compact ? 15 : 16}
          className={cn(
            "shrink-0",
            event.status === "done" && "text-emerald-400",
            event.status === "error" && "text-red-400",
            event.status === "running" && "animate-spin text-[--color-brand]"
          )}
        />
        <div className="min-w-0 flex-1">
          <div className={cn("truncate font-mono text-white/92", compact ? "text-[12px]" : "text-[13px]")}>
            {event.name}
          </div>
          <div className={cn("mt-1 text-[--color-muted-foreground]", compact ? "text-[10px]" : "text-[11px]")}>
            {event.status === "running"
              ? "Working through this action"
              : event.status === "error"
                ? "Action failed"
                : "Action completed"}
          </div>
        </div>
        <span
          className={cn(
            "rounded-full border font-medium uppercase tracking-[0.16em]",
            compact ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px]",
            event.status === "done" && "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
            event.status === "error" && "border-red-400/20 bg-red-400/10 text-red-300",
            event.status === "running" && "border-cyan-400/20 bg-cyan-400/10 text-cyan-200"
          )}
        >
          {statusLabel}
        </span>
        <ChevronDown
          size={compact ? 13 : 14}
          className={cn("shrink-0 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className={cn("border-t border-white/10 bg-black/10", compact ? "px-3.5 py-2.5" : "px-4 py-3")}>
          <pre
            className={cn(
              "overflow-auto whitespace-pre-wrap break-words rounded-xl bg-black/20 font-mono leading-relaxed text-[--color-muted-foreground]",
              compact ? "max-h-40 p-2.5 text-[10px]" : "max-h-56 p-3 text-[11px]"
            )}
          >
            {formatValue({ args: event.args, output: event.output })}
          </pre>
        </div>
      )}
    </div>
  );
}
