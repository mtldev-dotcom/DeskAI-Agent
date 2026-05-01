"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import GridLayout, { WidthProvider, type Layout } from "react-grid-layout";
import type { DeskWidget, WidgetLayout } from "@/lib/types";
import { WidgetFrame } from "./WidgetFrame";

const ResponsiveGrid = WidthProvider(GridLayout);

interface DeskCanvasProps {
  deskId: string;
  widgets: DeskWidget[];
}

function toGridLayout(widget: DeskWidget, index: number): Layout {
  const layout = widget.layout;
  return {
    i: widget.id,
    x: Number.isFinite(layout.x) ? layout.x : 0,
    y: Number.isFinite(layout.y) ? layout.y : index * 6,
    w: Number.isFinite(layout.w) ? Math.max(2, Math.min(layout.w, 12)) : 6,
    h: Number.isFinite(layout.h) ? Math.max(3, layout.h) : 5,
    minW: layout.minW ?? 2,
    minH: layout.minH ?? 3,
  };
}

function toWidgetLayout(item: Layout): WidgetLayout {
  return {
    x: item.x,
    y: item.y,
    w: item.w,
    h: item.h,
    ...(item.minW ? { minW: item.minW } : {}),
    ...(item.minH ? { minH: item.minH } : {}),
  };
}

async function persistLayout(widgetId: string, layout: WidgetLayout) {
  await fetch(`/api/widgets/${encodeURIComponent(widgetId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ layout }),
  });
}

export function DeskCanvas({ deskId, widgets }: DeskCanvasProps) {
  const [layout, setLayout] = useState<Layout[]>(() => widgets.map(toGridLayout));
  const [savingIds, setSavingIds] = useState<Set<string>>(() => new Set());
  const latestLayout = useRef(layout);

  const widgetsById = useMemo(() => new Map(widgets.map((widget) => [widget.id, widget])), [widgets]);

  const markSaving = useCallback((ids: string[], saving: boolean) => {
    setSavingIds((current) => {
      const next = new Set(current);
      for (const id of ids) {
        if (saving) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }, []);

  const saveLayout = useCallback(
    async (nextLayout: Layout[]) => {
      const changed = nextLayout.filter((item) => {
        const previous = latestLayout.current.find((current) => current.i === item.i);
        return (
          previous &&
          (previous.x !== item.x || previous.y !== item.y || previous.w !== item.w || previous.h !== item.h)
        );
      });

      if (!changed.length) return;
      latestLayout.current = nextLayout;
      setLayout(nextLayout);
      markSaving(changed.map((item) => item.i), true);

      await Promise.all(changed.map((item) => persistLayout(item.i, toWidgetLayout(item))));
      markSaving(changed.map((item) => item.i), false);
    },
    [markSaving]
  );

  if (!widgets.length) {
    return (
      <div className="glass flex min-h-80 items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.03]">
        <div className="h-28 w-28 rounded-full border border-white/10 bg-white/5" aria-hidden />
      </div>
    );
  }

  return (
    <div data-desk-id={deskId} className="min-h-0">
      <ResponsiveGrid
        className="desks-grid-layout"
        layout={layout}
        cols={12}
        rowHeight={32}
        margin={[12, 12]}
        containerPadding={[0, 0]}
        draggableHandle=".widget-drag-handle"
        isBounded
        resizeHandles={["se"]}
        onLayoutChange={(nextLayout) => setLayout(nextLayout)}
        onDragStop={(nextLayout) => {
          saveLayout(nextLayout).catch(() => markSaving(nextLayout.map((item) => item.i), false));
        }}
        onResizeStop={(nextLayout) => {
          saveLayout(nextLayout).catch(() => markSaving(nextLayout.map((item) => item.i), false));
        }}
      >
        {layout.map((item) => {
          const widget = widgetsById.get(item.i);
          if (!widget) return null;
          return (
            <div key={item.i} className="min-h-0">
              <WidgetFrame widget={widget} saving={savingIds.has(item.i)} />
            </div>
          );
        })}
      </ResponsiveGrid>
    </div>
  );
}
