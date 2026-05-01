"use client";

import Link from "next/link";
import { LayoutGrid, MoreVertical, Trash2 } from "lucide-react";
import { GlassSurface } from "@/components/visual/GlassSurface";
import { cn } from "@/lib/utils";
import type { Resource } from "@/lib/db/schema";

interface DeskContent {
  systemPrompt?: string;
  model?: string;
  widgetIds?: string[];
}

interface DeskCardProps {
  desk: Resource;
  onDelete?: (id: string) => void;
}

export function DeskCard({ desk, onDelete }: DeskCardProps) {
  const content = desk.content as DeskContent;

  return (
    <GlassSurface
      elevated
      className="group relative flex flex-col gap-3 p-4 transition-all hover:border-white/20"
    >
      <Link href={`/desks/${desk.id}`} className="absolute inset-0 rounded-xl" aria-label={desk.name} />

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[--color-brand]/10 text-[--color-brand]">
            <LayoutGrid size={18} />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-sm text-[--color-foreground]">{desk.name}</p>
            <p className="text-xs text-[--color-muted-foreground]">
              {content.widgetIds?.length ?? 0} widget{(content.widgetIds?.length ?? 0) !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {onDelete && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onDelete(desk.id);
            }}
            className={cn(
              "relative z-10 flex h-8 w-8 items-center justify-center rounded-lg",
              "text-[--color-muted-foreground] hover:text-red-400 hover:bg-red-400/10",
              "transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
              "min-h-[44px] min-w-[44px] -m-1"
            )}
            aria-label={`Delete ${desk.name}`}
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {content.systemPrompt && (
        <p className="text-xs text-[--color-muted-foreground] line-clamp-2 leading-relaxed">
          {content.systemPrompt}
        </p>
      )}

      <div className="flex items-center gap-1.5 text-[10px] text-[--color-muted-foreground]">
        <span className="rounded-full bg-white/5 px-2 py-0.5">
          {content.model ?? "default model"}
        </span>
      </div>
    </GlassSurface>
  );
}
