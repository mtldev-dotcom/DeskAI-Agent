export function CodeWidget({ code, language }: { code?: unknown; language?: unknown }) {
  const safeCode = typeof code === "string" ? code : "";
  const safeLanguage = typeof language === "string" ? language : "text";

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
