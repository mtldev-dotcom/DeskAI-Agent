import { getServerSession } from "next-auth";
import { db } from "@/lib/db/client";
import { users, workspaces } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { authOptions } from "./config";

export interface WorkspaceContext {
  userId: string;
  workspaceId: string;
}

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return null;

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return user ?? null;
}

export async function requireWorkspace(): Promise<WorkspaceContext> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthenticated");
  if (!user.defaultWorkspaceId) throw new Error("No workspace");

  return {
    userId: user.id,
    workspaceId: user.defaultWorkspaceId,
  };
}

export async function resolveUserWorkspace(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user?.defaultWorkspaceId) return null;

  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, user.defaultWorkspaceId))
    .limit(1);

  return workspace ? { user, workspace } : null;
}
