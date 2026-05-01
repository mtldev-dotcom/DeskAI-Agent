import { db } from "@/lib/db/client";
import { workspaceMembers, users } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export type Role = "owner" | "admin" | "member";

export async function getMemberRole(
  workspaceId: string,
  userId: string
): Promise<Role | null> {
  const [row] = await db
    .select({ role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, userId)
      )
    )
    .limit(1);

  return row?.role ?? null;
}

export async function requireRole(
  workspaceId: string,
  userId: string,
  minimum: Role
): Promise<void> {
  const role = await getMemberRole(workspaceId, userId);
  if (!role) throw new Error("Not a workspace member");

  const order: Role[] = ["member", "admin", "owner"];
  if (order.indexOf(role) < order.indexOf(minimum)) {
    throw new Error(`Requires role: ${minimum}`);
  }
}

export async function isGlobalAdmin(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ isGlobalAdmin: users.isGlobalAdmin })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return row?.isGlobalAdmin ?? false;
}
