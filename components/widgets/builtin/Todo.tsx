"use client";

import { useState, useRef } from "react";
import { Check, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TodoItem } from "@/lib/types";

interface TodoWidgetProps {
  widgetId: string;
  items?: unknown;
  isEditing?: boolean;
}

function parseItems(raw: unknown): TodoItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is TodoItem =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as TodoItem).id === "string" &&
      typeof (item as TodoItem).text === "string" &&
      typeof (item as TodoItem).done === "boolean"
  );
}

async function patchWidget(widgetId: string, items: TodoItem[]) {
  await fetch(`/api/widgets/${encodeURIComponent(widgetId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ props: { items } }),
  });
}

export function TodoWidget({ widgetId, items: rawItems, isEditing }: TodoWidgetProps) {
  const [items, setItems] = useState<TodoItem[]>(() => parseItems(rawItems));
  const [newText, setNewText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function toggleItem(id: string) {
    const updated = items.map((item) => (item.id === id ? { ...item, done: !item.done } : item));
    setItems(updated);
    await patchWidget(widgetId, updated);
  }

  async function addItem() {
    const text = newText.trim();
    if (!text) return;
    const newItem: TodoItem = { id: crypto.randomUUID(), text, done: false };
    const updated = [...items, newItem];
    setItems(updated);
    setNewText("");
    await patchWidget(widgetId, updated);
    inputRef.current?.focus();
  }

  async function removeItem(id: string) {
    const updated = items.filter((item) => item.id !== id);
    setItems(updated);
    await patchWidget(widgetId, updated);
  }

  const done = items.filter((i) => i.done).length;

  return (
    <div className="flex h-full flex-col gap-1">
      {items.length > 0 && (
        <p className="mb-1 text-xs text-[--color-muted-foreground]">
          {done}/{items.length} completed
        </p>
      )}

      <ul className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {items.map((item) => (
          <li key={item.id} className="group flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleItem(item.id)}
              aria-label={item.done ? "Mark incomplete" : "Mark complete"}
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                item.done
                  ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-400"
                  : "border-white/20 bg-white/5 text-transparent hover:border-white/40"
              )}
            >
              <Check size={11} />
            </button>
            <span
              className={cn(
                "flex-1 text-sm",
                item.done ? "text-[--color-muted-foreground] line-through" : "text-[--color-foreground]"
              )}
            >
              {item.text}
            </span>
            {isEditing && (
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                aria-label="Remove item"
                className="ml-auto flex h-5 w-5 items-center justify-center rounded text-[--color-muted-foreground] opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
              >
                <X size={12} />
              </button>
            )}
          </li>
        ))}
      </ul>

      {isEditing && (
        <div className="mt-2 flex items-center gap-2 border-t border-white/10 pt-2">
          <input
            ref={inputRef}
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addItem();
              }
            }}
            placeholder="Add a task…"
            className="flex-1 rounded-md bg-white/5 px-2 py-1.5 text-sm text-[--color-foreground] placeholder-[--color-muted-foreground] outline-none focus:bg-white/8 focus:ring-1 focus:ring-white/20"
          />
          <button
            type="button"
            onClick={addItem}
            disabled={!newText.trim()}
            aria-label="Add item"
            className="flex h-7 w-7 items-center justify-center rounded-md bg-white/5 text-[--color-muted-foreground] hover:bg-white/10 hover:text-[--color-foreground] disabled:opacity-40"
          >
            <Plus size={14} />
          </button>
        </div>
      )}

      {!items.length && !isEditing && (
        <p className="text-sm text-[--color-muted-foreground]">No tasks yet. Click edit to add tasks.</p>
      )}
    </div>
  );
}
