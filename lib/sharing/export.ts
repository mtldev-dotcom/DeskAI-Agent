import { db } from "@/lib/db/client";
import { resources, widgetInstances } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export interface DeskExport {
  version: 1;
  desk: {
    id: string;
    name: string;
    content: any;
    metadata: any;
    widgets: Array<{
      id: string;
      kind: string;
      props: any;
      layout: any;
    }>;
  };
  skills: Array<{
    id: string;
    name: string;
    content: any;
    metadata: any;
    placement: string;
    when: string | null;
  }>;
  exportedAt: string;
  exportedBy: string | null;
}

export async function exportDesk(
  deskId: string,
  workspaceId: string,
  userId: string | null
): Promise<DeskExport> {
  // Get the desk
  const [desk] = await db
    .select()
    .from(resources)
    .where(
      and(
        eq(resources.id, deskId),
        eq(resources.workspaceId, workspaceId),
        eq(resources.kind, "desk")
      )
    )
    .limit(1);

  if (!desk) {
    throw new Error("Desk not found");
  }

  // Get widgets for this desk from widgetInstances table
  const widgets = await db
    .select()
    .from(widgetInstances)
    .where(
      and(
        eq(widgetInstances.deskId, deskId)
      )
    );

  // Get skills in the workspace
  const skills = await db
    .select({
      id: resources.id,
      name: resources.name,
      content: resources.content,
      metadata: resources.metadata,
    })
    .from(resources)
    .where(
      and(
        eq(resources.kind, "skill"),
        eq(resources.workspaceId, workspaceId)
      )
    );

  const exportData: DeskExport = {
    version: 1,
    desk: {
      id: desk.id,
      name: desk.name,
      content: desk.content,
      metadata: desk.metadata,
      widgets: widgets.map((w) => ({
        id: w.id,
        kind: "widget", // Widget instances don't have kind field, assume "widget"
        props: (w.props as any) || {},
        layout: (w.layout as any) || {},
      })),
    },
    skills: skills.map((s) => ({
      id: s.id,
      name: s.name,
      content: s.content,
      metadata: s.metadata,
      placement: (s.metadata as any)?.placement || "system",
      when: (s.metadata as any)?.when || null,
    })),
    exportedAt: new Date().toISOString(),
    exportedBy: userId,
  };

  return exportData;
}
