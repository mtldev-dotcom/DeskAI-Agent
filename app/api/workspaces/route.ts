import { NextRequest, NextResponse } from "next/server";
import { provisionWorkspaceForUser } from "@/lib/auth/provision";
import { getCurrentUser } from "@/lib/auth/workspace";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const body = await req.json();
  const workspaceName: string = body.workspaceName ?? "My Workspace";
  const result = await provisionWorkspaceForUser(user, workspaceName);

  return NextResponse.json(result, { status: user.defaultWorkspaceId ? 200 : 201 });
}
