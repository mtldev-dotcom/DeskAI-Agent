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

export function MarkdownWidget({ content }: { content?: unknown }) {
  const source = typeof content === "string" ? content : "";
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
