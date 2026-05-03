"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import GridLayout, { WidthProvider, type Layout } from "react-grid-layout";
import { Plus, LayoutDashboard } from "lucide-react";
import { useTranslations } from "next-intl";
import type { DeskWidget, WidgetLayout } from "@/lib/types";
import { WidgetFrame } from "./WidgetFrame";
import { WidgetPicker } from "./WidgetPicker";

const ResponsiveGrid = WidthProvider(GridLayout);

// Widgets that are always interactive — no separate edit mode toggle needed
const ALWAYS_INTERACTIVE: Set<string> = new Set(["richtext", "whiteboard", "browser"]);

// Widgets that support direct editing via edit mode
const EDITABLE_TYPES: Set<string> = new Set(["markdown", "kanban", "code", "todo"]);

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

async function deleteWidget(widgetId: string) {
  await fetch(`/api/widgets/${encodeURIComponent(widgetId)}`, { method: "DELETE" });
}

export function DeskCanvas({ deskId, widgets: initialWidgets }: DeskCanvasProps) {
  const t = useTranslations("canvas");
  const [widgetsList, setWidgetsList] = useState<DeskWidget[]>(initialWidgets);
  const [layout, setLayout] = useState<Layout[]>(() => initialWidgets.map(toGridLayout));
  const [savingIds, setSavingIds] = useState<Set<string>>(() => new Set());
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const latestLayout = useRef(layout);

  const widgetsById = useMemo(() => new Map(widgetsList.map((w) => [w.id, w])), [widgetsList]);

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

  function handleAddWidget(widget: DeskWidget) {
    const gridItem = toGridLayout(widget, widgetsList.length);
    setWidgetsList((prev) => [...prev, widget]);
    setLayout((prev) => [...prev, gridItem]);
    latestLayout.current = [...latestLayout.current, gridItem];
  }

  function handleDeleteWidget(widgetId: string) {
    // Optimistic removal
    setWidgetsList((prev) => prev.filter((w) => w.id !== widgetId));
    setLayout((prev) => prev.filter((item) => item.i !== widgetId));
    latestLayout.current = latestLayout.current.filter((item) => item.i !== widgetId);
    if (editingWidgetId === widgetId) setEditingWidgetId(null);

    deleteWidget(widgetId).catch(() => {
      // On error, re-fetch would be ideal; for now silently fail
      // (version history allows recovery)
    });
  }

  if (!widgetsList.length) {
    return (
      <>
        <div className="glass flex min-h-80 flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-white/10 bg-white/[0.03]">
          <LayoutDashboard size={32} className="text-[--color-muted-foreground] opacity-40" aria-hidden />
          <div className="text-center">
            <p className="text-sm font-medium text-[--color-foreground]">{t("emptyTitle")}</p>
            <p className="mt-1 text-xs text-[--color-muted-foreground]">{t("emptySubtitle")}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-[--color-foreground] hover:bg-white/10 transition-colors"
          >
            <Plus size={15} />
            {t("addWidget")}
          </button>
        </div>

        {showPicker && (
          <WidgetPicker
            deskId={deskId}
            onAdd={handleAddWidget}
            onClose={() => setShowPicker(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div data-desk-id={deskId} className="relative min-h-0">
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
            const isEditing = editingWidgetId === widget.id;
            const showEditBtn = EDITABLE_TYPES.has(widget.type);
            return (
              <div key={item.i} className="min-h-0">
                <WidgetFrame
                  widget={widget}
                  saving={savingIds.has(item.i)}
                  isEditing={isEditing}
                  onEdit={showEditBtn ? () => setEditingWidgetId(widget.id) : undefined}
                  onEditDone={() => setEditingWidgetId(null)}
                  onDelete={() => handleDeleteWidget(widget.id)}
                />
              </div>
            );
          })}
        </ResponsiveGrid>

        {/* Floating Add Widget button */}
        <div className="mt-4 flex justify-start">
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-[--color-muted-foreground] hover:bg-white/[0.07] hover:text-[--color-foreground] transition-colors"
          >
            <Plus size={14} />
            {t("addWidget")}
          </button>
        </div>
      </div>

      {showPicker && (
        <WidgetPicker
          deskId={deskId}
          onAdd={handleAddWidget}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}
