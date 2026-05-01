"use client";

import { GripVertical, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeskWidget } from "@/lib/types";
import { WidgetRenderer } from "./WidgetRenderer";

interface WidgetFrameProps {
  widget: DeskWidget;
  saving?: boolean;
}

export function WidgetFrame({ widget, saving }: WidgetFrameProps) {
  return (
    <article className="glass flex h-full min-h-0 flex-col overflow-hidden rounded-lg shadow-lg shadow-black/10">
      <header className="widget-drag-handle flex min-h-11 cursor-grab items-center gap-2 border-b border-white/10 px-2 active:cursor-grabbing">
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[--color-muted-foreground]"
          aria-label="Drag widget"
          title="Drag widget"
        >
          <GripVertical size={16} />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-[--color-foreground]">{widget.name}</h2>
        </div>
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-[--color-muted-foreground]">
          {widget.type}
        </span>
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[--color-muted-foreground]",
            saving && "text-cyan-200"
          )}
          title={saving ? "Saving" : "Resizable"}
          aria-label={saving ? "Saving widget" : "Widget can be resized"}
        >
          <Maximize2 size={15} />
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <WidgetRenderer widget={widget} />
      </div>
    </article>
  );
}
