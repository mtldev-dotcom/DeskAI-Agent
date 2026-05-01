interface SandboxDocumentInput {
  html: string;
  script?: string;
  props: Record<string, unknown>;
  widgetInstanceId: string;
}

function escapeClosingScript(value: string) {
  return value.replaceAll("</script", "<\\/script");
}

export function buildSandboxDocument({
  html,
  script = "",
  props,
  widgetInstanceId,
}: SandboxDocumentInput) {
  const safeProps = escapeClosingScript(JSON.stringify(props));
  const initialScriptBody = escapeClosingScript(
    JSON.stringify(`"use strict"; return (async () => { ${script}\n })();`)
  );

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <style>
      :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
      * { box-sizing: border-box; }
      body { margin: 0; min-height: 100vh; background: transparent; color: #f6f7fb; }
      a { color: #9fb7ff; }
      button, input, textarea, select { font: inherit; }
    </style>
  </head>
  <body>
    <div id="root">${html}</div>
    <script>
      const __desksai = {
        widgetInstanceId: ${JSON.stringify(widgetInstanceId)},
        props: ${safeProps}
      };

      function send(type, payload) {
        parent.postMessage({ source: "desksai-sandbox", type, widgetInstanceId: __desksai.widgetInstanceId, payload }, "*");
      }

      const api = {
        props: __desksai.props,
        console: {
          log: (...args) => send("console", args.map(String)),
          error: (...args) => send("console", args.map(String))
        },
        desk: {
          read: () => Promise.resolve({ widgetInstanceId: __desksai.widgetInstanceId, props: __desksai.props })
        },
        widget: {
          patch: (nextProps) => {
            send("widget.patch", { props: nextProps });
            __desksai.props = { ...__desksai.props, ...nextProps };
            api.props = __desksai.props;
            return Promise.resolve(__desksai.props);
          }
        }
      };

      window.DesksAI = api;
      window.addEventListener("message", async (event) => {
        if (event.data?.source !== "desksai-parent" || event.data?.type !== "exec") return;
        try {
          const run = new Function("api", '"use strict"; return (async () => { ' + event.data.code + "\\n })();");
          const result = await run(api);
          send("exec.result", { result });
        } catch (error) {
          send("exec.error", { error: error instanceof Error ? error.message : String(error) });
        }
      });

      try {
        const run = new Function("api", ${initialScriptBody});
        run(api).catch((error) => send("script.error", { error: error instanceof Error ? error.message : String(error) }));
      } catch (error) {
        send("script.error", { error: error instanceof Error ? error.message : String(error) });
      }
    </script>
  </body>
</html>`;
}

declare global {
  interface Window {
    DesksAI?: {
      props: Record<string, unknown>;
      console: Pick<Console, "log" | "error">;
      desk: {
        read: () => Promise<Record<string, unknown>>;
      };
      widget: {
        patch: (nextProps: Record<string, unknown>) => Promise<Record<string, unknown>>;
      };
    };
  }
}
