import type { OpenRouterTool } from "../openrouter-client";
import { browserTools, handleBrowserTool } from "./browser";
import { codeExecTools, handleCodeExecTool } from "./code-exec";
import { deskTools, handleDeskTool } from "./desk";
import { memoryTools, handleMemoryTool } from "./memory";
import { skillTools, handleSkillTool } from "./skill";
import { widgetTools, handleWidgetTool } from "./widget";

export interface ToolContext {
  workspaceId: string;
  userId: string;
  deskId: string | null;
}

const toolNameMap = new Map<string, string>();

function apiToolName(name: string) {
  return name.replaceAll(".", "_");
}

function normalizeTool(tool: OpenRouterTool): OpenRouterTool {
  const publicName = tool.function.name;
  const apiName = apiToolName(publicName);
  toolNameMap.set(apiName, publicName);
  toolNameMap.set(publicName, publicName);

  return {
    ...tool,
    function: {
      ...tool.function,
      name: apiName,
      description: `${tool.function.description} Internal tool name: ${publicName}.`,
    },
  };
}

export const openRouterTools: OpenRouterTool[] = [
  ...deskTools,
  ...widgetTools,
  ...skillTools,
  ...memoryTools,
  ...browserTools,
  ...codeExecTools,
].map(normalizeTool);

export function publicToolName(name: string) {
  return toolNameMap.get(name) ?? name;
}

export async function dispatchTool(
  name: string,
  args: Record<string, unknown>,
  context: ToolContext
) {
  const publicName = publicToolName(name);

  if (publicName.startsWith("desk.")) {
    return handleDeskTool(publicName, args, context);
  }

  if (publicName.startsWith("widget.")) {
    return handleWidgetTool(publicName, args, context);
  }

  if (publicName.startsWith("skill.")) {
    return handleSkillTool(publicName, args, context);
  }

  if (publicName.startsWith("memory.")) {
    return handleMemoryTool(publicName, args, context);
  }

  if (publicName.startsWith("browser.")) {
    return handleBrowserTool(publicName, args);
  }

  if (publicName.startsWith("code.")) {
    return handleCodeExecTool(publicName, args);
  }

  throw new Error(`Unknown tool: ${publicName}`);
}
