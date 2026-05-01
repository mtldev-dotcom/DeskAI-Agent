import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

async function text(path) {
  return readFile(new URL(`../../${path}`, import.meta.url), "utf8");
}

test("P2 streaming route exposes expected SSE event types", async () => {
  const route = await text("app/api/chat/stream/route.ts");

  assert.match(route, /text\/event-stream/);
  assert.match(route, /type: "delta"/);
  assert.match(route, /type: event\.status === "running" \? "tool_call" : "tool_result"/);
  assert.match(route, /writeDone\(controller\)/);
  assert.match(route, /writeError\(controller, error\)/);
});

test("agent runtime loads prompt context and persists assistant/tool output", async () => {
  const runtime = await text("lib/agent/runtime.ts");

  assert.match(runtime, /getOrCreateConversation/);
  assert.match(runtime, /loadSkills/);
  assert.match(runtime, /formatMemoriesForPrompt/);
  assert.match(runtime, /streamChat/);
  assert.match(runtime, /dispatchTool/);
  assert.match(runtime, /appendAssistantMessage/);
  assert.match(runtime, /appendToolCall/);
});

test("tool dispatcher keeps public dotted names while normalizing OpenRouter names", async () => {
  const tools = await text("lib/agent/tools/index.ts");

  assert.match(tools, /replaceAll\("\.", "_"\)/);
  assert.match(tools, /publicToolName/);
  assert.match(tools, /handleDeskTool/);
  assert.match(tools, /handleWidgetTool/);
  assert.match(tools, /handleSkillTool/);
  assert.match(tools, /handleMemoryTool/);
  assert.match(tools, /handleBrowserTool/);
  assert.match(tools, /handleCodeExecTool/);
});

test("chat UI renders streamed text and execution cards", async () => {
  const chat = await text("components/chat/ChatStream.tsx");
  const card = await text("components/chat/ExecutionCard.tsx");
  const overlay = await text("components/agent/AgentOverlay.tsx");

  assert.match(chat, /fetch\("\/api\/chat\/stream"/);
  assert.match(chat, /payload\.type === "delta"/);
  assert.match(chat, /payload\.type === "tool_call" \|\| payload\.type === "tool_result"/);
  assert.match(card, /event\.status === "done"/);
  assert.match(card, /event\.status === "error"/);
  assert.match(overlay, /ChatStream deskId=\{deskId\}/);
});

test("QA documentation tracks manual P1/P2 coverage", async () => {
  const qa = await text("docs/qa-testing.md");

  assert.match(qa, /Manual P1\/P2 QA/);
  assert.match(qa, /Desks CRUD/);
  assert.match(qa, /Chat Runtime/);
  assert.match(qa, /Negative Cases/);
});

test("P3 canvas renders persisted widgets through the builtin renderer registry", async () => {
  const page = await text("app/(app)/desks/[id]/page.tsx");
  const canvas = await text("components/canvas/DeskCanvas.tsx");
  const renderer = await text("components/canvas/WidgetRenderer.tsx");

  assert.match(page, /<DeskCanvas deskId=\{desk\.id\} widgets=\{canvasWidgets\}/);
  assert.match(canvas, /react-grid-layout/);
  assert.match(canvas, /draggableHandle="\.widget-drag-handle"/);
  assert.match(canvas, /\/api\/widgets\/\$\{encodeURIComponent\(widgetId\)\}/);
  assert.match(renderer, /MarkdownWidget/);
  assert.match(renderer, /KanbanWidget/);
  assert.match(renderer, /IframeWidget/);
});

test("P3 sandbox bridge accepts code.exec dispatch and scoped widget patches", async () => {
  const bridge = await text("lib/sandbox/iframe-bridge.ts");
  const iframe = await text("components/widgets/builtin/Iframe.tsx");
  const chat = await text("components/chat/ChatStream.tsx");
  const route = await text("app/api/widgets/[id]/route.ts");

  assert.match(bridge, /source: "desksai-sandbox"/);
  assert.match(bridge, /type !== "exec"/);
  assert.match(iframe, /sandbox="allow-scripts"/);
  assert.match(iframe, /desksai:sandbox-exec/);
  assert.match(chat, /dispatchSandboxExec/);
  assert.match(route, /eq\(resources\.workspaceId, workspaceId\)/);
});
