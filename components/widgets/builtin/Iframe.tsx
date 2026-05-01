"use client";

import { useEffect, useMemo, useRef } from "react";
import { buildSandboxDocument } from "@/lib/sandbox/iframe-bridge";

interface IframeWidgetProps {
  widgetInstanceId: string;
  props: Record<string, unknown>;
}

export function IframeWidget({ widgetInstanceId, props }: IframeWidgetProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const html = typeof props.html === "string" ? props.html : "<p>Custom widget</p>";
  const script = typeof props.script === "string" ? props.script : "";
  const srcDoc = useMemo(
    () => buildSandboxDocument({ html, script, props, widgetInstanceId }),
    [html, props, script, widgetInstanceId]
  );

  useEffect(() => {
    function handleSandboxMessage(event: MessageEvent<unknown>) {
      if (typeof event.data !== "object" || event.data === null) return;
      const data = event.data as {
        source?: string;
        type?: string;
        widgetInstanceId?: string;
        payload?: { props?: Record<string, unknown> };
      };

      if (data.source !== "desksai-sandbox" || data.widgetInstanceId !== widgetInstanceId) return;
      if (data.type === "widget.patch" && data.payload?.props) {
        fetch(`/api/widgets/${encodeURIComponent(widgetInstanceId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ props: data.payload.props }),
        }).catch(() => undefined);
      }
    }

    function handleSandboxExec(event: Event) {
      const detail = (event as CustomEvent<{ code?: string; widgetInstanceId?: string | null }>).detail;
      if (!detail?.code) return;
      if (detail.widgetInstanceId && detail.widgetInstanceId !== widgetInstanceId) return;

      iframeRef.current?.contentWindow?.postMessage(
        { source: "desksai-parent", type: "exec", code: detail.code },
        "*"
      );
    }

    window.addEventListener("message", handleSandboxMessage);
    window.addEventListener("desksai:sandbox-exec", handleSandboxExec);
    return () => {
      window.removeEventListener("message", handleSandboxMessage);
      window.removeEventListener("desksai:sandbox-exec", handleSandboxExec);
    };
  }, [widgetInstanceId]);

  return (
    <iframe
      ref={iframeRef}
      title="Custom widget sandbox"
      srcDoc={srcDoc}
      sandbox="allow-scripts"
      className="h-full min-h-0 w-full rounded-lg border border-white/10 bg-transparent"
    />
  );
}
