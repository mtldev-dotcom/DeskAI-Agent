"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import type { Editor, TLEditorSnapshot } from "@tldraw/tldraw";

interface WhiteboardWidgetProps {
  widgetId: string;
  snapshot?: unknown;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

async function patchWidget(widgetId: string, snapshot: TLEditorSnapshot) {
  await fetch(`/api/widgets/${encodeURIComponent(widgetId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ props: { snapshot } }),
  });
}

const TldrawComponent = dynamic(
  () => import("@tldraw/tldraw").then((mod) => mod.Tldraw),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
      </div>
    ),
  }
);

export function WhiteboardWidget({ widgetId, snapshot: rawSnapshot }: WhiteboardWidgetProps) {
  const widgetIdRef = useRef(widgetId);
  widgetIdRef.current = widgetId;

  const validSnapshot = rawSnapshot && typeof rawSnapshot === "object" ? rawSnapshot as TLEditorSnapshot : undefined;

  function handleMount(editor: Editor) {
    const cleanup = editor.store.listen(
      () => {
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
          const snapshot = editor.getSnapshot();
          patchWidget(widgetIdRef.current, snapshot).catch(() => {/* silent */});
        }, 2000);
      },
      { source: "user", scope: "document" }
    );
    return cleanup;
  }

  return (
    <div className="h-full w-full overflow-hidden rounded [&_.tl-container]:rounded [&_.tl-background]:rounded">
      <TldrawComponent
        snapshot={validSnapshot}
        onMount={handleMount}
        hideUi={false}
        forceMobile={false}
      />
    </div>
  );
}
