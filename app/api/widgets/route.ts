import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireWorkspace } from "@/lib/auth/workspace";
import { db } from "@/lib/db/client";
import { resources, widgetInstances } from "@/lib/db/schema";
import { createResourceVersion } from "@/lib/db/versions";
import { generateId } from "@/lib/utils";
import { getDefinition } from "@/lib/widgets/defaults";
import type { WidgetType } from "@/lib/types";

interface CreateWidgetBody {
  deskId: string;
  type: string;
  name: string;
  props?: Record<string, unknown>;
  layout?: { x?: number; y?: number; w?: number; h?: number };
}

export async function POST(req: NextRequest) {
  try {
    const { workspaceId, userId } = await requireWorkspace();
    const body = (await req.json()) as CreateWidgetBody;

    const { deskId, type, name, props, layout } = body;
    if (!deskId || !type || !name) {
      return NextResponse.json({ error: "deskId, type, and name are required" }, { status: 400 });
    }

    // Verify the desk belongs to this workspace
    const [desk] = await db
      .select()
      .from(resources)
      .where(eq(resources.id, deskId))
      .limit(1);

    if (!desk || desk.workspaceId !== workspaceId || desk.kind !== "desk") {
      return NextResponse.json({ error: "Desk not found" }, { status: 404 });
    }

    // Resolve definition — "crm" maps to kanban type
    const definition = getDefinition(type);
    const resolvedType: WidgetType | "custom" = (definition?.resolvedType ?? type) as WidgetType | "custom";

    // Merge default props with caller-provided props
    const mergedProps = {
      ...(definition?.defaultProps ?? {}),
      ...(props ?? {}),
      type: resolvedType,
      name,
    };

    // Merge default layout with caller-provided layout
    const defaultLayout = definition?.defaultLayout ?? { w: 6, h: 6 };
    const mergedLayout = {
      x: layout?.x ?? 0,
      y: layout?.y ?? 9999,
      w: layout?.w ?? defaultLayout.w,
      h: layout?.h ?? defaultLayout.h,
    };

    const instanceId = generateId();

    const [instance] = await db
      .insert(widgetInstances)
      .values({
        id: instanceId,
        deskId,
        props: mergedProps,
        layout: mergedLayout,
      })
      .returning();

    // Update desk's widgetIds array
    const content = desk.content as Record<string, unknown>;
    const widgetIds = Array.isArray(content.widgetIds) ? content.widgetIds : [];
    await db
      .update(resources)
      .set({
        content: { ...content, widgetIds: [...widgetIds, instanceId] },
        updatedAt: new Date(),
      })
      .where(eq(resources.id, deskId));

    await createResourceVersion({
      resourceId: deskId,
      authorId: userId,
      note: `Widget added: ${name} (${resolvedType})`,
    });

    return NextResponse.json(
      {
        id: instanceId,
        deskId,
        type: resolvedType,
        name,
        props: mergedProps,
        layout: mergedLayout,
        createdAt: instance.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 });
  }
}
