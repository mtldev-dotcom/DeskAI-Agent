"use client";

import { createContext, useContext } from "react";
import {
  ShapeUtil,
  HTMLContainer,
  useIsEditing,
  T,
  Rectangle2d,
  type TLBaseShape,
} from "@tldraw/tldraw";
import { WidgetFrame } from "./WidgetFrame";
import type { DeskWidget } from "@/lib/types";

// ─── Canvas context ────────────────────────────────────────────────────────
export interface CanvasContextValue {
  deleteWidget: (widgetId: string) => void;
  editingWidgetId: string | null;
  setEditingWidgetId: (id: string | null) => void;
  showPicker: boolean;
  setShowPicker: (show: boolean) => void;
  deskName: string;
  widgetCount: number;
}

export const CanvasContext = createContext<CanvasContextValue>({
  deleteWidget: () => {},
  editingWidgetId: null,
  setEditingWidgetId: () => {},
  showPicker: false,
  setShowPicker: () => {},
  deskName: "",
  widgetCount: 0,
});

// ─── Shape type ────────────────────────────────────────────────────────────
export type WidgetShapeProps = {
  w: number;
  h: number;
  widget: DeskWidget;
};

export type WidgetShape = TLBaseShape<"widget", WidgetShapeProps>;

const ALWAYS_INTERACTIVE = new Set(["richtext", "whiteboard", "browser"]);
const EDITABLE_TYPES = new Set(["markdown", "kanban", "code", "todo"]);

// ─── Shape utility ─────────────────────────────────────────────────────────
// TLShape is a closed built-in union; "widget" is a valid custom shape registered
// at runtime via shapeUtils prop on <Tldraw>. Suppress the constraint error here.
// @ts-expect-error — WidgetShape satisfies TLShape structurally but not nominally
export class WidgetShapeUtil extends ShapeUtil<WidgetShape> {
  static override type = "widget" as const;

  // props typed loosely — TLUnknownShape has no named keys; validators are correct at runtime
  static override props = {
    w: T.positiveNumber,
    h: T.positiveNumber,
    widget: T.jsonValue,
  };

  override getDefaultProps(): WidgetShape["props"] {
    return {
      w: 400,
      h: 300,
      widget: {
        id: "",
        type: "markdown",
        name: "Widget",
        props: {},
        layout: { x: 0, y: 0, w: 400, h: 300 },
      },
    };
  }

  override getGeometry(shape: WidgetShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  override canEdit() {
    return true;
  }

  override canResize() {
    return true;
  }

  override onResize(shape: WidgetShape, info: { scaleX: number; scaleY: number }) {
    return {
      props: {
        w: Math.max(280, shape.props.w * Math.abs(info.scaleX)),
        h: Math.max(180, shape.props.h * Math.abs(info.scaleY)),
      },
    };
  }

  override component(shape: WidgetShape) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { deleteWidget, editingWidgetId, setEditingWidgetId } = useContext(CanvasContext);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const isTldrawEditing = useIsEditing(shape.id);

    const widget = shape.props.widget as DeskWidget;
    const alwaysInteractive = ALWAYS_INTERACTIVE.has(widget.type);
    const pointerEvents: "all" | "none" = isTldrawEditing || alwaysInteractive ? "all" : "none";

    return (
      <HTMLContainer
        id={shape.id}
        style={{ width: shape.props.w, height: shape.props.h, overflow: "hidden" }}
      >
        <div
          style={{ width: "100%", height: "100%", pointerEvents }}
          // Prevent tldraw from receiving pointer events from interactive content
          onPointerDown={isTldrawEditing || alwaysInteractive ? (e) => e.stopPropagation() : undefined}
        >
          <WidgetFrame
            widget={widget}
            isEditing={editingWidgetId === widget.id}
            onEdit={EDITABLE_TYPES.has(widget.type) ? () => setEditingWidgetId(widget.id) : undefined}
            onEditDone={() => setEditingWidgetId(null)}
            onDelete={() => deleteWidget(widget.id)}
          />
        </div>
      </HTMLContainer>
    );
  }

  override indicator(shape: WidgetShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={8} />;
  }
}
