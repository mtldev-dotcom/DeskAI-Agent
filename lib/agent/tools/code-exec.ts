import type { OpenRouterTool } from "../openrouter-client";

export const codeExecTools: OpenRouterTool[] = [
  {
    type: "function",
    function: {
      name: "code.exec",
      description: "Execute sandboxed JavaScript in the frontend iframe sandbox",
      parameters: {
        type: "object",
        properties: {
          code: { type: "string", description: "JavaScript code to execute" },
          widgetInstanceId: {
            type: "string",
            description: "Widget instance to target (runs in its sandbox)",
          },
        },
        required: ["code"],
      },
    },
  },
];

// Full sandboxed execution is wired up in P3 via the iframe-bridge.
// Here we return the code as a pending execution card so the frontend renders it.
export async function handleCodeExecTool(
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  if (name === "code.exec") {
    return {
      type: "sandbox_exec",
      code: args.code,
      widgetInstanceId: args.widgetInstanceId ?? null,
      note: "Execution dispatched to frontend sandbox.",
    };
  }

  throw new Error(`Unknown code tool: ${name}`);
}
