"use client";

import { useState } from "react";
import { GripVertical, Pencil, Settings2, Trash2, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeskWidget } from "@/lib/types";
import { WidgetRenderer } from "./WidgetRenderer";

interface WidgetFrameProps {
  widget: DeskWidget;
  isEditing?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onSettings?: () => void;
  onEditDone?: () => void;
}

export function WidgetFrame({ widget, isEditing, onEdit, onDelete, onSettings, onEditDone }: WidgetFrameProps) {
  const [confirming, setConfirming] = useState(false);

  function handleDeleteClick() {
    setConfirming(true);
  }

  function handleConfirmDelete() {
    setConfirming(false);
    onDelete?.();
  }

  function handleCancelDelete() {
    setConfirming(false);
  }

  return (
    <article className="glass flex h-full min-h-0 flex-col overflow-hidden rounded-lg shadow-lg shadow-black/10">
      <header className="flex min-h-11 items-center gap-1 border-b border-white/10 px-2">
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[--color-muted-foreground]"
          aria-label="Drag widget"
          title="Drag widget"
        >
          <GripVertical size={16} />
        </button>

        {confirming ? (
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <span className="truncate text-xs text-[--color-muted-foreground]">Delete this widget?</span>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="flex h-7 items-center gap-1 rounded-md bg-red-500/20 px-2 text-xs text-red-300 hover:bg-red-500/30"
            >
              <Check size={12} />
              Delete
            </button>
            <button
              type="button"
              onClick={handleCancelDelete}
              className="flex h-7 items-center gap-1 rounded-md bg-white/5 px-2 text-xs text-[--color-muted-foreground] hover:bg-white/10"
            >
              <X size={12} />
              Cancel
            </button>
          </div>
        ) : (
          <>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-semibold text-[--color-foreground]">{widget.name}</h2>
            </div>
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-[--color-muted-foreground]">
              {widget.type}
            </span>
          </>
        )}

        {!confirming && (
          <div className="flex shrink-0 items-center gap-0.5">
            {onEdit && (
              <button
                type="button"
                onClick={isEditing ? onEditDone : onEdit}
                title={isEditing ? "Done editing" : "Edit widget"}
                aria-label={isEditing ? "Done editing" : "Edit widget"}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-md text-[--color-muted-foreground] hover:text-[--color-foreground] hover:bg-white/5",
                  isEditing && "text-cyan-300 hover:text-cyan-200"
                )}
              >
                <Pencil size={14} />
              </button>
            )}
            {onSettings && (
              <button
                type="button"
                onClick={onSettings}
                title="Widget settings"
                aria-label="Widget settings"
                className="flex h-9 w-9 items-center justify-center rounded-md text-[--color-muted-foreground] hover:text-[--color-foreground] hover:bg-white/5"
              >
                <Settings2 size={14} />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={handleDeleteClick}
                title="Delete widget"
                aria-label="Delete widget"
                className="flex h-9 w-9 items-center justify-center rounded-md text-[--color-muted-foreground] hover:text-red-400 hover:bg-white/5"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-auto p-3">
        <WidgetRenderer widget={widget} isEditing={isEditing} onEditDone={onEditDone} />
      </div>
    </article>
  );
}
