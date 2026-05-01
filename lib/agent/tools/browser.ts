import type { OpenRouterTool } from "../openrouter-client";

export const browserTools: OpenRouterTool[] = [
  {
    type: "function",
    function: {
      name: "browser.navigate",
      description: "Navigate to a URL in the browser widget on the current Desk",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL to navigate to" },
          widgetInstanceId: { type: "string", description: "Target browser widget instance (optional)" },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "browser.extract",
      description: "Extract text content from the current page in the browser widget",
      parameters: {
        type: "object",
        properties: {
          widgetInstanceId: { type: "string" },
          selector: { type: "string", description: "CSS selector to extract from (optional)" },
        },
      },
    },
  },
];

// P6 will wire these to a real headless Browserless backend.
// For now return a stub so the agent knows the tool exists.
export async function handleBrowserTool(
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  if (name === "browser.navigate") {
    return {
      ok: true,
      url: args.url,
      note: "Browser widget navigation queued. Full headless support arrives in P6.",
    };
  }

  if (name === "browser.extract") {
    return {
      ok: false,
      note: "Browser extraction not yet implemented (P6).",
    };
  }

  throw new Error(`Unknown browser tool: ${name}`);
}
