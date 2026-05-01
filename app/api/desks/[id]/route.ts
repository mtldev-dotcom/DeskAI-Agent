import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { resources } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { requireWorkspace } from "@/lib/auth/workspace";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await requireWorkspace();
    const { id } = await params;

    const [desk] = await db
      .select()
      .from(resources)
      .where(
        and(
          eq(resources.id, id),
          eq(resources.workspaceId, workspaceId),
          eq(resources.kind, "desk")
        )
      )
      .limit(1);

    if (!desk) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(desk);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 401 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await requireWorkspace();
    const { id } = await params;
    const body = await req.json();

    const updates: Partial<typeof resources.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) updates.name = body.name;
    if (body.content !== undefined) updates.content = body.content;
    if (body.metadata !== undefined) updates.metadata = body.metadata;

    const [updated] = await db
      .update(resources)
      .set(updates)
      .where(
        and(
          eq(resources.id, id),
          eq(resources.workspaceId, workspaceId),
          eq(resources.kind, "desk")
        )
      )
      .returning();

    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await requireWorkspace();
    const { id } = await params;

    await db
      .update(resources)
      .set({ archivedAt: new Date() })
      .where(
        and(
          eq(resources.id, id),
          eq(resources.workspaceId, workspaceId),
          eq(resources.kind, "desk")
        )
      );

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}
