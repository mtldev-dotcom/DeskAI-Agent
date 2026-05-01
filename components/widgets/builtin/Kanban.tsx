import type { KanbanColumn } from "@/lib/types";

function isKanbanColumn(value: unknown): value is KanbanColumn {
  return (
    typeof value === "object" &&
    value !== null &&
    "title" in value &&
    typeof (value as { title: unknown }).title === "string"
  );
}

export function KanbanWidget({ columns }: { columns?: unknown }) {
  const safeColumns = Array.isArray(columns) ? columns.filter(isKanbanColumn) : [];

  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-3 overflow-auto md:grid-cols-3">
      {safeColumns.map((column, columnIndex) => (
        <section key={column.id ?? column.title} className="min-h-32 rounded-lg border border-white/10 bg-black/15 p-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-sm font-semibold text-[--color-foreground]">{column.title}</h3>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-[--color-muted-foreground]">
              {column.cards?.length ?? 0}
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {(column.cards ?? []).map((card, cardIndex) => (
              <article
                key={card.id ?? `${columnIndex}-${cardIndex}`}
                className="rounded-lg border border-white/10 bg-white/5 p-3"
              >
                <h4 className="text-sm font-medium text-[--color-foreground]">{card.title}</h4>
                {card.body ? <p className="mt-1 text-xs leading-5 text-[--color-muted-foreground]">{card.body}</p> : null}
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
