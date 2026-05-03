"use client";

import { useState } from "react";

function renderInline(text: string) {
  const strongPattern = /\*\*(.*?)\*\*/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match = strongPattern.exec(text);

  while (match) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push(
      <strong key={`${match.index}-${match[1]}`} className="font-semibold text-[--color-foreground]">
        {match[1]}
      </strong>
    );
    lastIndex = match.index + match[0].length;
    match = strongPattern.exec(text);
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

async function patchWidget(widgetId: string, content: string) {
  await fetch(`/api/widgets/${encodeURIComponent(widgetId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ props: { content } }),
  });
}

interface MarkdownWidgetProps {
  content?: unknown;
  widgetId?: string;
  isEditing?: boolean;
  onEditDone?: () => void;
}

export function MarkdownWidget({ content, widgetId, isEditing, onEditDone }: MarkdownWidgetProps) {
  const source = typeof content === "string" ? content : "";
  const [draft, setDraft] = useState(source);

  async function handleDone() {
    if (widgetId) {
      await patchWidget(widgetId, draft);
    }
    onEditDone?.();
  }

  if (isEditing && widgetId) {
    return (
      <div className="flex h-full flex-col gap-2">
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="flex-1 resize-none rounded-md bg-white/5 p-2 font-mono text-xs text-[--color-foreground] placeholder-[--color-muted-foreground] outline-none focus:ring-1 focus:ring-white/20"
          placeholder="# Title&#10;&#10;Write your notes here…"
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleDone}
            className="rounded-md bg-white/10 px-3 py-1.5 text-xs text-[--color-foreground] hover:bg-white/15"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  const lines = source.split(/\r?\n/);

  return (
    <div className="space-y-2 overflow-auto text-sm leading-6 text-[--color-muted-foreground]">
      {lines.map((line, index) => {
        if (!line.trim()) return <div key={index} className="h-2" />;
        if (line.startsWith("# ")) {
          return (
            <h2 key={index} className="text-lg font-semibold text-[--color-foreground]">
              {line.slice(2)}
            </h2>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h3 key={index} className="text-base font-semibold text-[--color-foreground]">
              {line.slice(3)}
            </h3>
          );
        }
        if (line.startsWith("- ")) {
          return (
            <div key={index} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white/30" />
              <span>{renderInline(line.slice(2))}</span>
            </div>
          );
        }
        return <p key={index}>{renderInline(line)}</p>;
      })}
    </div>
  );
}
