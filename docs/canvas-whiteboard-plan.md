# Canvas → Whiteboard Redesign Plan

Last updated: 2026-05-04

## Goal

Replace the current `react-grid-layout` grid canvas with a full tldraw-based infinite whiteboard canvas. Users get:

- Free drag-drop widget positioning (no grid snapping)
- Zoom in/out (scroll wheel + pinch)
- Pan (spacebar drag or middle-mouse)
- Built-in drawing tools: pen, shapes (rect/ellipse/arrow), text, highlighter, sticky notes
- Widgets sit on the canvas as draggable/resizable cards
- Double-click a widget to enter interactive mode (edit content)
- Single-click selects; drag moves

---

## Architecture

### Before
```
react-grid-layout (12-col grid, 32px rows)
  └── WidgetFrame (drag handle class, Maximize2 resize icon)
       └── WidgetRenderer → widget component
```

### After
```
tldraw (infinite canvas, pan/zoom, drawing tools)
  └── WidgetShapeUtil (custom BaseBoxShapeUtil)
       └── HTMLContainer
            └── WidgetFrame → WidgetRenderer → widget component
```

### Key design decisions

| Decision | Choice | Reason |
|---|---|---|
| Canvas base | tldraw (already installed) | Free pan/zoom + drawing tools out of the box |
| Widget interaction | double-click = edit mode | Standard Figma/Miro UX pattern |
| Drawing persistence | tldraw localStorage per desk (`persistenceKey`) | Drawings survive reload without DB changes |
| Widget position persistence | DB via PATCH /api/widgets/[id] | Source of truth is DB, not localStorage |
| Layout units | Switch from grid units to pixels | tldraw uses pixel coordinates |
| Grid unit migration | Auto-convert on load (w ≤ 12 & h ≤ 30 → multiply) | Existing widgets render at correct size |
| "Add Widget" button | Floating overlay via tldraw `InFrontOfTheCanvas` | Doesn't interfere with tldraw toolbar |
| Desk name header | Same floating overlay, top-left | Non-interactive, pointer-events-none |
| Agent overlay | Unchanged (fixed position, z-50) | Still works since it's position:fixed |

---

## Files

### New
| File | Status | Purpose |
|---|---|---|
| `components/canvas/WidgetShapeUtil.tsx` | ✅ created | tldraw custom shape + CanvasContext |
| `docs/canvas-whiteboard-plan.md` | ✅ this file | Plan + todo tracking |

### Rewritten
| File | Status | Purpose |
|---|---|---|
| `components/canvas/DeskCanvas.tsx` | ✅ rewritten | tldraw canvas base, replaces react-grid-layout |

### Updated
| File | Status | Change made |
|---|---|---|
| `app/[locale]/(app)/desks/[id]/page.tsx` | ✅ done | Full-height layout; `deskName` prop; `isWidgetType` fixed for todo/richtext/whiteboard |
| `components/canvas/WidgetFrame.tsx` | ✅ done | Removed `widget-drag-handle` + `cursor-grab`; removed Maximize2 + saving indicator |
| `components/widgets/builtin/Whiteboard.tsx` | ✅ done | Removed `@tldraw/tldraw/tldraw.css` import |
| `types/tldraw-custom-shapes.d.ts` | ✅ done | Created (augmentation file — not used at runtime, kept for docs) |

### Unchanged
- `components/canvas/WidgetRenderer.tsx` — no changes needed
- `components/canvas/WidgetPicker.tsx` — no changes needed
- All widget components — no changes needed
- `lib/types.ts` — WidgetLayout x/y/w/h reinterpreted as pixels (no schema change)
- `app/api/widgets/[id]/route.ts` — PATCH accepts layout, no change needed

---

## Todos

- [x] Create `WidgetShapeUtil.tsx` — custom tldraw shape + CanvasContext
- [x] Rewrite `DeskCanvas.tsx` — tldraw canvas base
- [x] Update `app/[locale]/(app)/desks/[id]/page.tsx`:
  - [x] Change page wrapper to `h-dvh overflow-hidden` (no padding/scroll)
  - [x] Remove `max-w-5xl` centered container
  - [x] Remove desk header `<h1>` and widget count `<p>` (now inside CanvasToolbar)
  - [x] Pass `deskName={desk.name}` prop to `<DeskCanvas>`
  - [x] Add `todo | richtext | whiteboard` to `isWidgetType()` guard
- [x] Update `components/canvas/WidgetFrame.tsx`:
  - [x] Remove `widget-drag-handle` class from `<header>` (react-grid-layout gone)
  - [x] Remove `cursor-grab active:cursor-grabbing` from header (tldraw manages cursor)
  - [x] Remove Maximize2 icon + saving indicator in header (tldraw handles resize natively)
  - [x] Keep GripVertical icon as visual affordance only (no functional role)
  - [x] Keep pencil / trash / settings buttons unchanged
- [x] Update `components/widgets/builtin/Whiteboard.tsx`:
  - [x] Remove `import "@tldraw/tldraw/tldraw.css"` (DeskCanvas.tsx now imports it)
- [x] Run `pnpm tsc --noEmit` — passes clean
- [x] Run `pnpm build` — passes clean
- [ ] Manual smoke test: open a desk, verify:
  - Canvas loads with tldraw drawing tools visible
  - Existing widgets appear as draggable cards
  - Draw a shape/line on the canvas (pen tool)
  - Drag a widget to a new position — persists after reload
  - Double-click a widget → enters interactive mode
  - Add widget via picker → appears at viewport center
  - Delete widget → disappears from canvas
  - Zoom in/out with scroll wheel
  - Agent overlay still works (chat, tool calls)

---

## Known risks / watch out

- **tldraw toolbar vs AgentOverlay overlap on mobile**: tldraw's toolbar is bottom-center; AgentOverlay on mobile is a full-width bottom sheet. May visually conflict. Fix: add bottom padding to tldraw or adjust AgentOverlay z-index. Deferred to V2.
- **Whiteboard widget inside tldraw canvas**: nested tldraw editors. Should work (each has its own React context) but may have styling edge cases. If broken, the inner whiteboard widget becomes a static image fallback.
- **react-grid-layout dep**: still in package.json. Can remove it with `pnpm remove react-grid-layout` after confirming the build is clean. Deferred.
- **`shapeUtils` vs `customShapeUtils` prop**: tldraw v4 may use `shapeUtils` instead of `customShapeUtils`. If TSC errors, check the Tldraw prop name.
- **`T.jsonValue` for DeskWidget prop**: typed as `JsonValue` in tldraw store. Inside `component()` we cast `shape.props.widget as DeskWidget`. If store validation rejects complex nested objects, fall back to storing only `widgetId` and looking up widget via React context.

---

## Phase context

This work is a UI/UX improvement between P-Widget (complete) and P5 (Telegram, pending). It does not affect the DB schema, agent tools, or API routes. After this is done, the next step remains P5 (Telegram integration).
