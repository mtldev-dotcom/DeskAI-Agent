"use client";

import { useCallback, useContext, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { createShapeId } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import type { Editor, TLAnyShapeUtilConstructor, TLShapeId } from "@tldraw/tldraw";
import type { DeskWidget, WidgetLayout } from "@/lib/types";
import { WidgetPicker } from "./WidgetPicker";
import { CanvasContext, WidgetShapeUtil, type WidgetShape } from "./WidgetShapeUtil";

// ─── Lazy tldraw (no SSR) ──────────────────────────────────────────────────
const Tldraw = dynamic(() => import("@tldraw/tldraw").then((m) => m.Tldraw), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[--color-background]">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
    </div>
  ),
});

// Cast required: TLShape union is closed; WidgetShapeUtil is valid at runtime
const CUSTOM_SHAPE_UTILS = [WidgetShapeUtil] as unknown as TLAnyShapeUtilConstructor[];

// ─── Layout conversion (grid units → pixels on first load) ────────────────
function convertLayout(layout: WidgetLayout) {
  // Grid-unit layouts have w ≤ 12 and h ≤ 30 — convert to pixels
  const isGrid = layout.w <= 12 && layout.h <= 30;
  return {
    x: isGrid ? layout.x * 105 : layout.x,
    y: isGrid ? layout.y * 32 : layout.y,
    w: isGrid ? Math.max(280, layout.w * 105) : Math.max(280, layout.w),
    h: isGrid ? Math.max(180, layout.h * 32) : Math.max(180, layout.h),
  };
}

function widgetShapeId(widgetId: string): TLShapeId {
  return createShapeId(widgetId);
}

// ─── Toolbar overlay rendered inside tldraw via InFrontOfTheCanvas ─────────
function CanvasToolbar() {
  const { setShowPicker, deskName, widgetCount } = useContext(CanvasContext);
  const t = useTranslations("canvas");
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[200] flex items-start justify-between p-3">
      <div className="pointer-events-none select-none">
        <h1 className="text-base font-semibold text-white/80 drop-shadow-sm">{deskName}</h1>
        <p className="text-[11px] text-white/40">
          {widgetCount} {widgetCount === 1 ? "widget" : "widgets"}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setShowPicker(true)}
        className="pointer-events-auto flex items-center gap-1.5 rounded-lg border border-white/15 bg-black/55 px-3 py-2 text-sm font-medium text-white/85 shadow-lg shadow-black/30 backdrop-blur-sm hover:bg-black/70 hover:text-white transition-colors"
      >
        <Plus size={14} />
        {t("addWidget")}
      </button>
    </div>
  );
}

// ─── Props ─────────────────────────────────────────────────────────────────
export interface DeskCanvasProps {
  deskId: string;
  deskName: string;
  widgets: DeskWidget[];
}

// ─── Main component ────────────────────────────────────────────────────────
export function DeskCanvas({ deskId, deskName, widgets: initialWidgets }: DeskCanvasProps) {
  const [widgetsList, setWidgetsList] = useState<DeskWidget[]>(initialWidgets);
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const editorRef = useRef<Editor | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Mount: sync DB widgets → tldraw shapes ──────────────────────────────
  const handleMount = useCallback(
    (editor: Editor) => {
      editorRef.current = editor;

      // Collect which widget IDs should exist as shapes
      const expectedIds = new Set(widgetsList.map((w) => widgetShapeId(w.id)));

      // Remove orphaned shapes (e.g. previously persisted, now deleted from DB)
      const allShapes = editor.getCurrentPageShapes() as unknown as WidgetShape[];
      const orphans = allShapes
        .filter((s) => s.type === "widget" && !expectedIds.has(s.id as TLShapeId))
        .map((s) => s.id as TLShapeId);
      if (orphans.length) editor.deleteShapes(orphans);

      // Create missing shapes
      const missing = widgetsList.filter((w) => !editor.getShape(widgetShapeId(w.id)));
      if (missing.length) {
        const newShapes = missing.map((widget) => {
          const { x, y, w, h } = convertLayout(widget.layout);
          return { id: widgetShapeId(widget.id), type: "widget" as const, x, y, props: { w, h, widget } };
        });
        // Cast required: tldraw's createShapes union only includes built-in shape types
        editor.createShapes(newShapes as unknown as Parameters<typeof editor.createShapes>[0]);
      }

      // Persist position/size changes to DB with 1 s debounce
      editor.store.listen(
        () => {
          if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
          saveTimerRef.current = setTimeout(() => {
            const shapes = (editor.getCurrentPageShapes() as unknown as WidgetShape[]).filter(
              (s) => s.type === "widget"
            );

            for (const shape of shapes) {
              fetch(`/api/widgets/${encodeURIComponent(shape.props.widget.id)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  layout: { x: shape.x, y: shape.y, w: shape.props.w, h: shape.props.h },
                }),
              }).catch(() => {});
            }
          }, 1000);
        },
        { source: "user", scope: "document" }
      );
    },
    // initialWidgets reference is stable for a given page load
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // ─── Add widget (from picker) ────────────────────────────────────────────
  const handleAddWidget = useCallback((widget: DeskWidget) => {
    setWidgetsList((prev) => [...prev, widget]);

    const editor = editorRef.current;
    if (!editor) return;

    const bounds = editor.getViewportPageBounds();
    const cx = bounds.x + bounds.w / 2;
    const cy = bounds.y + bounds.h / 2;
    const { w, h } = convertLayout(widget.layout);

    const newShape = { id: widgetShapeId(widget.id), type: "widget" as const, x: cx - w / 2, y: cy - h / 2, props: { w, h, widget } };
    editor.createShape(newShape as unknown as Parameters<typeof editor.createShape>[0]);
  }, []);

  // ─── Delete widget ───────────────────────────────────────────────────────
  const handleDeleteWidget = useCallback(
    (widgetId: string) => {
      setWidgetsList((prev) => prev.filter((w) => w.id !== widgetId));
      if (editingWidgetId === widgetId) setEditingWidgetId(null);

      const editor = editorRef.current;
      if (editor) editor.deleteShapes([widgetShapeId(widgetId)]);

      fetch(`/api/widgets/${encodeURIComponent(widgetId)}`, { method: "DELETE" }).catch(() => {});
    },
    [editingWidgetId]
  );

  const contextValue = useMemo<import("./WidgetShapeUtil").CanvasContextValue>(
    () => ({
      deleteWidget: handleDeleteWidget,
      editingWidgetId,
      setEditingWidgetId,
      showPicker,
      setShowPicker,
      deskName,
      widgetCount: widgetsList.length,
    }),
    [handleDeleteWidget, editingWidgetId, showPicker, deskName, widgetsList.length]
  );

  return (
    <CanvasContext.Provider value={contextValue}>
      <div className="relative h-full w-full">
        <Tldraw
          persistenceKey={`desk-${deskId}`}
          shapeUtils={CUSTOM_SHAPE_UTILS}
          onMount={handleMount}
          components={{
            InFrontOfTheCanvas: CanvasToolbar,
          }}
        />

        {showPicker && (
          <WidgetPicker
            deskId={deskId}
            onAdd={handleAddWidget}
            onClose={() => setShowPicker(false)}
          />
        )}
      </div>
    </CanvasContext.Provider>
  );
}
