import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { requireWorkspace } from "@/lib/auth/workspace";
import { db } from "@/lib/db/client";
import { resources } from "@/lib/db/schema";
import { listResourceVersions } from "@/lib/db/versions";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await requireWorkspace();
    const { id } = await params;

    // Verify the resource exists in the current workspace
    const [resource] = await db
      .select()
      .from(resources)
      .where(
        and(
          eq(resources.id, id),
          eq(resources.workspaceId, workspaceId)
        )
      )
      .limit(1);

    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    const versions = await listResourceVersions(id);
    return NextResponse.json(versions);
  } catch (error) {
    console.error("Failed to list resource versions:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}