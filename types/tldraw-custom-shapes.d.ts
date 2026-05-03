import type { JsonValue } from "@tldraw/tldraw";

// Register the custom "widget" shape type with tldraw's type system.
// TLGlobalShapePropsMap is the official extension point (docs: line 3381 of tlschema/index.d.ts).
declare module "@tldraw/tlschema" {
  interface TLGlobalShapePropsMap {
    widget: {
      w: number;
      h: number;
      widget: JsonValue;
    };
  }
}
