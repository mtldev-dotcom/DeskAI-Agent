import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { requireWorkspace } from "@/lib/auth/workspace";
import { db } from "@/lib/db/client";
import { resources } from "@/lib/db/schema";
import { rollbackToVersion } from "@/lib/db/versions";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId, userId } = await requireWorkspace();
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

    const body = await req.json();
    const { versionId } = body;

    if (!versionId || typeof versionId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid versionId" },
        { status: 400 }
      );
    }

    const newVersionId = await rollbackToVersion(versionId, userId);

    return NextResponse.json({
      ok: true,
      message: "Resource rolled back successfully",
      newVersionId,
      resourceId: id,
    });
  } catch (error) {
    console.error("Failed to rollback resource:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}