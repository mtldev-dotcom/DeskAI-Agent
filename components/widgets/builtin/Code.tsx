"use client";

import { useState } from "react";

const LANGUAGES = ["javascript", "typescript", "python", "rust", "go", "html", "css", "sql", "bash", "json", "text"];

async function patchWidget(widgetId: string, code: string, language: string) {
  await fetch(`/api/widgets/${encodeURIComponent(widgetId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ props: { code, language } }),
  });
}

interface CodeWidgetProps {
  code?: unknown;
  language?: unknown;
  widgetId?: string;
  isEditing?: boolean;
  onEditDone?: () => void;
}

export function CodeWidget({ code, language, widgetId, isEditing, onEditDone }: CodeWidgetProps) {
  const safeCode = typeof code === "string" ? code : "";
  const safeLanguage = typeof language === "string" ? language : "text";
  const [draft, setDraft] = useState(safeCode);
  const [draftLang, setDraftLang] = useState(safeLanguage);

  async function handleDone() {
    if (widgetId) {
      await patchWidget(widgetId, draft, draftLang);
    }
    onEditDone?.();
  }

  if (isEditing && widgetId) {
    return (
      <div className="flex h-full flex-col gap-2">
        <div className="flex items-center gap-2">
          <select
            value={draftLang}
            onChange={(e) => setDraftLang(e.target.value)}
            className="rounded-md bg-white/10 px-2 py-1 text-xs text-[--color-foreground] outline-none focus:ring-1 focus:ring-white/20"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleDone}
            className="ml-auto rounded-md bg-white/10 px-3 py-1 text-xs text-[--color-foreground] hover:bg-white/15"
          >
            Done
          </button>
        </div>
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          spellCheck={false}
          className="flex-1 resize-none rounded-lg border border-white/10 bg-black/30 p-3 font-mono text-xs leading-5 text-[--color-foreground] outline-none focus:ring-1 focus:ring-white/20"
        />
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 overflow-hidden rounded-lg border border-white/10 bg-black/30">
      <div className="border-b border-white/10 px-3 py-2 text-xs uppercase tracking-wider text-[--color-muted-foreground]">
        {safeLanguage}
      </div>
      <pre className="h-full overflow-auto p-3 text-xs leading-5 text-[--color-foreground]">
        <code>{safeCode || "// No code yet"}</code>
      </pre>
    </div>
  );
}
