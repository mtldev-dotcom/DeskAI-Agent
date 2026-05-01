import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { requireWorkspace } from "@/lib/auth/workspace";
import { db } from "@/lib/db/client";
import { resources, widgetInstances } from "@/lib/db/schema";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

async function loadWidgetInWorkspace(widgetId: string, workspaceId: string) {
  const [row] = await db
    .select({
      widget: widgetInstances,
      desk: resources,
    })
    .from(widgetInstances)
    .innerJoin(resources, eq(widgetInstances.deskId, resources.id))
    .where(
      and(
        eq(widgetInstances.id, widgetId),
        eq(resources.workspaceId, workspaceId),
        eq(resources.kind, "desk")
      )
    )
    .limit(1);

  return row?.widget ?? null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await requireWorkspace();
    const { id } = await params;
    const widget = await loadWidgetInWorkspace(id, workspaceId);
    if (!widget) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = (await req.json()) as { props?: unknown; layout?: unknown };
    const updates: Partial<typeof widgetInstances.$inferInsert> = { updatedAt: new Date() };

    const props = asRecord(body.props);
    if (props) {
      updates.props = { ...(widget.props as Record<string, unknown>), ...props };
    }

    const layout = asRecord(body.layout);
    if (layout) {
      updates.layout = { ...(widget.layout as Record<string, unknown>), ...layout };
    }

    const [updated] = await db
      .update(widgetInstances)
      .set(updates)
      .where(eq(widgetInstances.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await requireWorkspace();
    const { id } = await params;
    const widget = await loadWidgetInWorkspace(id, workspaceId);
    if (!widget) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.delete(widgetInstances).where(eq(widgetInstances.id, id));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 });
  }
}
