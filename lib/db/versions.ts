import { db } from "./client";
import { resources, resourceVersions } from "./schema";
import { eq, desc } from "drizzle-orm";
import { generateId } from "@/lib/utils";
import { compare as createPatch, applyPatch } from "fast-json-patch";
import type { Operation } from "fast-json-patch";

interface VersionCreateOptions {
  resourceId: string;
  authorId?: string;
  note?: string;
}

/**
 * Create a new version entry for a resource, automatically calculating
 * the diff from the previous version (if any).
 */
export async function createResourceVersion({
  resourceId,
  authorId,
  note,
}: VersionCreateOptions): Promise<string> {
  // 1. Fetch current resource content
  const [resource] = await db
    .select({ content: resources.content, updatedAt: resources.updatedAt })
    .from(resources)
    .where(eq(resources.id, resourceId))
    .limit(1);

  if (!resource) {
    throw new Error(`Resource ${resourceId} not found`);
  }

  // 2. Fetch previous version (most recent)
  const [previousVersion] = await db
    .select({ content: resourceVersions.content })
    .from(resourceVersions)
    .where(eq(resourceVersions.resourceId, resourceId))
    .orderBy(desc(resourceVersions.createdAt))
    .limit(1);

  // 3. Calculate diff
  const currentContent = resource.content as any;
  const previousContent = (previousVersion?.content as any) ?? {};
  const diff = createPatch(previousContent, currentContent);

  // 4. Insert new version
  const versionId = generateId();
  await db.insert(resourceVersions).values({
    id: versionId,
    resourceId,
    content: currentContent,
    diff: diff.length > 0 ? diff : undefined,
    authorId: authorId ?? null,
    note: note ?? null,
    createdAt: new Date(),
  });

  return versionId;
}

/**
 * Apply a specific version's diff to restore its content.
 * Creates a new version entry (restore) rather than modifying the existing one.
 */
export async function rollbackToVersion(
  versionId: string,
  authorId?: string
): Promise<string> {
  // 1. Fetch the target version
  const [target] = await db
    .select({
      version: resourceVersions,
      resourceId: resourceVersions.resourceId,
    })
    .from(resourceVersions)
    .where(eq(resourceVersions.id, versionId))
    .limit(1);

  if (!target) {
    throw new Error(`Version ${versionId} not found`);
  }

  // 2. Fetch current resource content
  const [resource] = await db
    .select({ content: resources.content })
    .from(resources)
    .where(eq(resources.id, target.resourceId))
    .limit(1);

  if (!resource) {
    throw new Error(`Resource ${target.resourceId} not found`);
  }

  // 3. If the version has a diff, apply it; otherwise use its content directly
  const targetContent = target.version.content as any;
  const currentContent = resource.content as any;

  const diff = target.version.diff as Operation[] | null;
  let restoredContent = targetContent;
  if (diff && diff.length > 0) {
    // Apply diff forward (previous → target)
    const result = applyPatch(currentContent, diff, true, false);
    if (result.newDocument === undefined) {
      throw new Error("Failed to apply diff patch");
    }
    restoredContent = result.newDocument;
  }

  // 4. Update resource content
  await db
    .update(resources)
    .set({
      content: restoredContent,
      updatedAt: new Date(),
    })
    .where(eq(resources.id, target.resourceId));

  // 5. Create a new version entry for this rollback
  const newVersionId = generateId();
  await db.insert(resourceVersions).values({
    id: newVersionId,
    resourceId: target.resourceId,
    content: restoredContent,
    diff: createPatch(currentContent, restoredContent),
    authorId: authorId ?? null,
    note: `Restored to version ${versionId}`,
    createdAt: new Date(),
  });

  return newVersionId;
}

/**
 * List all versions for a resource, newest first.
 */
export async function listResourceVersions(resourceId: string) {
  return await db
    .select()
    .from(resourceVersions)
    .where(eq(resourceVersions.resourceId, resourceId))
    .orderBy(desc(resourceVersions.createdAt));
}

/**
 * Get a single version by ID.
 */
export async function getVersion(versionId: string) {
  const [version] = await db
    .select()
    .from(resourceVersions)
    .where(eq(resourceVersions.id, versionId))
    .limit(1);
  return version ?? null;
}