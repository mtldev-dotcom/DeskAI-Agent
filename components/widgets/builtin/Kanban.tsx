"use client";

import { useState, useRef } from "react";
import { Plus, X } from "lucide-react";
import type { KanbanColumn, KanbanCard } from "@/lib/types";

function isKanbanColumn(value: unknown): value is KanbanColumn {
  return (
    typeof value === "object" &&
    value !== null &&
    "title" in value &&
    typeof (value as { title: unknown }).title === "string"
  );
}

async function patchWidget(widgetId: string, columns: KanbanColumn[]) {
  await fetch(`/api/widgets/${encodeURIComponent(widgetId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ props: { columns } }),
  });
}

interface KanbanWidgetProps {
  columns?: unknown;
  widgetId?: string;
  isEditing?: boolean;
}

export function KanbanWidget({ columns: rawColumns, widgetId, isEditing }: KanbanWidgetProps) {
  const safeInitial = Array.isArray(rawColumns) ? rawColumns.filter(isKanbanColumn) : [];
  const [columns, setColumns] = useState<KanbanColumn[]>(safeInitial);
  const [newCardText, setNewCardText] = useState<Record<string, string>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function updateColumns(next: KanbanColumn[]) {
    setColumns(next);
    if (widgetId) await patchWidget(widgetId, next);
  }

  async function addCard(columnId: string) {
    const text = (newCardText[columnId] ?? "").trim();
    if (!text) return;
    const next = columns.map((col) => {
      const colKey = col.id ?? col.title;
      if (colKey !== columnId) return col;
      return {
        ...col,
        cards: [...(col.cards ?? []), { id: crypto.randomUUID(), title: text }],
      };
    });
    await updateColumns(next);
    setNewCardText((prev) => ({ ...prev, [columnId]: "" }));
    inputRefs.current[columnId]?.focus();
  }

  async function removeCard(columnId: string, cardId: string) {
    const next = columns.map((col) => {
      const colKey = col.id ?? col.title;
      if (colKey !== columnId) return col;
      return { ...col, cards: (col.cards ?? []).filter((c) => (c.id ?? c.title) !== cardId) };
    });
    await updateColumns(next);
  }

  async function updateColumnTitle(columnId: string, title: string) {
    const next = columns.map((col) => {
      const colKey = col.id ?? col.title;
      return colKey === columnId ? { ...col, title } : col;
    });
    setColumns(next);
    // Debounce title save on blur
  }

  async function saveColumnTitle(columnId: string, title: string) {
    const next = columns.map((col) => {
      const colKey = col.id ?? col.title;
      return colKey === columnId ? { ...col, title } : col;
    });
    await updateColumns(next);
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-3 overflow-auto md:grid-cols-3">
      {columns.map((column) => {
        const colKey = column.id ?? column.title;
        return (
          <section key={colKey} className="flex min-h-32 flex-col rounded-lg border border-white/10 bg-black/15 p-3">
            <div className="flex items-center justify-between gap-2">
              {isEditing && widgetId ? (
                <input
                  value={column.title}
                  onChange={(e) => updateColumnTitle(colKey, e.target.value)}
                  onBlur={(e) => saveColumnTitle(colKey, e.target.value)}
                  className="flex-1 truncate bg-transparent text-sm font-semibold text-[--color-foreground] outline-none focus:bg-white/5 focus:px-1 focus:rounded"
                />
              ) : (
                <h3 className="truncate text-sm font-semibold text-[--color-foreground]">{column.title}</h3>
              )}
              <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-xs text-[--color-muted-foreground]">
                {column.cards?.length ?? 0}
              </span>
            </div>

            <div className="mt-3 flex-1 space-y-2">
              {(column.cards ?? []).map((card: KanbanCard) => {
                const cardKey = card.id ?? card.title;
                return (
                  <article
                    key={cardKey}
                    className="group relative rounded-lg border border-white/10 bg-white/5 p-3"
                  >
                    <h4 className="text-sm font-medium text-[--color-foreground] pr-5">{card.title}</h4>
                    {card.body ? <p className="mt-1 text-xs leading-5 text-[--color-muted-foreground]">{card.body}</p> : null}
                    {isEditing && widgetId && (
                      <button
                        type="button"
                        onClick={() => removeCard(colKey, cardKey)}
                        aria-label="Remove card"
                        className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded text-[--color-muted-foreground] opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </article>
                );
              })}
            </div>

            {isEditing && widgetId && (
              <div className="mt-2 flex items-center gap-1 border-t border-white/10 pt-2">
                <input
                  ref={(el) => { inputRefs.current[colKey] = el; }}
                  type="text"
                  value={newCardText[colKey] ?? ""}
                  onChange={(e) => setNewCardText((prev) => ({ ...prev, [colKey]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCard(colKey);
                    }
                  }}
                  placeholder="Add card…"
                  className="flex-1 rounded bg-white/5 px-2 py-1 text-xs text-[--color-foreground] placeholder-[--color-muted-foreground] outline-none focus:ring-1 focus:ring-white/20"
                />
                <button
                  type="button"
                  onClick={() => addCard(colKey)}
                  disabled={!(newCardText[colKey] ?? "").trim()}
                  aria-label="Add card"
                  className="flex h-6 w-6 items-center justify-center rounded text-[--color-muted-foreground] hover:bg-white/10 hover:text-[--color-foreground] disabled:opacity-40"
                >
                  <Plus size={12} />
                </button>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
