import { NextRequest, NextResponse } from "next/server";
import { requireWorkspace } from "@/lib/auth/workspace";
import { writeDone, writeError, writeEvent } from "@/lib/sse/stream";
import { runAgent } from "@/lib/agent/runtime";

interface ChatStreamBody {
  deskId?: string;
  text?: string;
  channel?: "web" | "telegram" | "admin";
}

export async function POST(req: NextRequest) {
  let body: ChatStreamBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = body.text?.trim();
  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const { userId, workspaceId } = await requireWorkspace();
        await runAgent({
          userId,
          workspaceId,
          deskId: body.deskId ?? null,
          channel: body.channel ?? "web",
          text,
          onDelta(delta) {
            writeEvent(controller, { type: "delta", text: delta });
          },
          onToolCall(event) {
            writeEvent(controller, {
              type: event.status === "running" ? "tool_call" : "tool_result",
              id: event.id,
              name: event.name,
              args: event.args,
              status: event.status,
              output: event.output,
            });
          },
        });
        writeDone(controller);
      } catch (error) {
        writeError(controller, error);
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
