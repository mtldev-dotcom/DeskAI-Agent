function normalizeUrl(value: unknown) {
  if (typeof value !== "string") return "about:blank";
  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") return url.toString();
  } catch {
    return "about:blank";
  }
  return "about:blank";
}

export function BrowserWidget({ url }: { url?: unknown }) {
  const src = normalizeUrl(url);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-white/10 bg-black/20">
      <div className="flex min-h-9 items-center border-b border-white/10 px-3 text-xs text-[--color-muted-foreground]">
        <span className="truncate">{src}</span>
      </div>
      <iframe title="Browser widget" src={src} sandbox="allow-scripts" className="min-h-0 flex-1 bg-white" />
    </div>
  );
}
