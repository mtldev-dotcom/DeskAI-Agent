import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { resources, users, workspaces, workspaceMembers } from "@/lib/db/schema";
import { generateId, slugify } from "@/lib/utils";
import type { User } from "@/lib/db/schema";

export async function provisionWorkspaceForUser(
  user: User,
  workspaceName = "My Workspace"
) {
  if (user.defaultWorkspaceId) {
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, user.defaultWorkspaceId))
      .limit(1);
    return { workspace, user };
  }

  const workspaceId = generateId();
  const slug = `${slugify(workspaceName) || "workspace"}-${workspaceId.slice(0, 6)}`;

  const [workspace] = await db
    .insert(workspaces)
    .values({
      id: workspaceId,
      slug,
      name: workspaceName,
      ownerId: user.id,
    })
    .returning();

  await db.insert(workspaceMembers).values({
    workspaceId,
    userId: user.id,
    role: "owner",
  });

  const [onboardingTemplate] = await db
    .select()
    .from(resources)
    .where(
      and(
        eq(resources.kind, "onboarding_template"),
        eq(resources.layer, "L0"),
        eq(resources.name, "default-onboarding")
      )
    )
    .limit(1);

  let deskId: string | null = null;
  if (onboardingTemplate) {
    deskId = generateId();
    await db.insert(resources).values({
      id: deskId,
      workspaceId,
      userId: user.id,
      layer: "L1",
      kind: "desk",
      name: "Welcome",
      content: onboardingTemplate.content,
      metadata: {},
    });
  }

  const [updatedUser] = await db
    .update(users)
    .set({
      defaultWorkspaceId: workspaceId,
      ...(deskId ? { defaultDeskId: deskId } : {}),
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))
    .returning();

  return { workspace, user: updatedUser };
}
