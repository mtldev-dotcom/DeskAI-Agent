import type { ChartDatum } from "@/lib/types";

function normalizeData(data: unknown, xKey: unknown, yKey: unknown): ChartDatum[] {
  if (!Array.isArray(data)) return [];
  const labelKey = typeof xKey === "string" ? xKey : "label";
  const valueKey = typeof yKey === "string" ? yKey : "value";

  return data
    .map((item): ChartDatum | null => {
      if (typeof item !== "object" || item === null) return null;
      const row = item as Record<string, unknown>;
      const label = row[labelKey] ?? row.label ?? row.x;
      const value = row[valueKey] ?? row.value ?? row.y;
      if (typeof label !== "string" && typeof label !== "number") return null;
      if (typeof value !== "number") return null;
      return { label: String(label), value };
    })
    .filter((item): item is ChartDatum => item !== null);
}

export function ChartWidget({ data, xKey, yKey }: { data?: unknown; xKey?: unknown; yKey?: unknown }) {
  const rows = normalizeData(data, xKey, yKey);
  const max = Math.max(...rows.map((row) => row.value), 1);

  if (!rows.length) {
    return <div className="flex h-full items-center justify-center text-sm text-[--color-muted-foreground]">No chart data</div>;
  }

  return (
    <div className="flex h-full min-h-0 items-end gap-2 overflow-x-auto px-1 pt-4">
      {rows.map((row) => (
        <div key={row.label} className="flex h-full min-w-14 flex-1 flex-col justify-end gap-2">
          <div
            className="min-h-2 rounded-t-md border border-cyan-300/30 bg-cyan-300/70"
            style={{ height: `${Math.max(6, (row.value / max) * 100)}%` }}
            title={`${row.label}: ${row.value}`}
          />
          <div className="truncate text-center text-xs text-[--color-muted-foreground]">{row.label}</div>
        </div>
      ))}
    </div>
  );
}
