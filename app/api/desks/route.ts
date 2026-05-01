import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { resources } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { requireWorkspace } from "@/lib/auth/workspace";
import { generateId } from "@/lib/utils";

export async function GET() {
  try {
    const { workspaceId } = await requireWorkspace();

    const desks = await db
      .select()
      .from(resources)
      .where(
        and(
          eq(resources.kind, "desk"),
          eq(resources.workspaceId, workspaceId),
          isNull(resources.archivedAt)
        )
      )
      .orderBy(resources.updatedAt);

    return NextResponse.json(desks);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, workspaceId } = await requireWorkspace();
    const body = await req.json();
    const name = (body.name as string)?.trim();

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const id = generateId();
    const [desk] = await db
      .insert(resources)
      .values({
        id,
        workspaceId,
        userId,
        layer: "L1",
        kind: "desk",
        name,
        content: {
          widgetIds: [],
          systemPrompt: "",
          model: process.env.OPENROUTER_DEFAULT_MODEL ?? "anthropic/claude-sonnet-4-6",
        },
        metadata: {},
      })
      .returning();

    return NextResponse.json(desk, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}
