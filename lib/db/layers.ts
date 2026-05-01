import { db } from "./client";
import { resources } from "./schema";
import { and, eq, or, sql } from "drizzle-orm";
import type { Resource } from "./schema";

type ResourceKind =
  | "desk"
  | "widget"
  | "skill"
  | "prompt_include"
  | "memory"
  | "onboarding_template";

interface ResolveOptions {
  workspaceId: string;
  userId?: string;
}

/**
 * Layer resolver: returns the highest-priority resource for a given kind+name.
 * Priority: L2 (user) > L1 (workspace) > L0 (firmware).
 */
export async function resolveResource(
  kind: ResourceKind,
  name: string,
  { workspaceId, userId }: ResolveOptions
): Promise<Resource | null> {
  const rows = await db
    .select()
    .from(resources)
    .where(
      and(
        eq(resources.kind, kind),
        eq(resources.name, name),
        eq(resources.enabled, true),
        or(
          eq(resources.layer, "L0"),
          and(eq(resources.layer, "L1"), eq(resources.workspaceId, workspaceId)),
          userId
            ? and(
                eq(resources.layer, "L2"),
                eq(resources.workspaceId, workspaceId),
                eq(resources.userId, userId)
              )
            : sql`false`
        )
      )
    )
    .orderBy(
      sql`CASE ${resources.layer} WHEN 'L2' THEN 0 WHEN 'L1' THEN 1 ELSE 2 END`
    )
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Returns ALL resources for a kind, merged across layers with deduplication.
 * Higher layers shadow lower layers for the same name.
 */
export async function resolveAllResources(
  kind: ResourceKind,
  { workspaceId, userId }: ResolveOptions
): Promise<Resource[]> {
  const rows = await db
    .select()
    .from(resources)
    .where(
      and(
        eq(resources.kind, kind),
        eq(resources.enabled, true),
        or(
          eq(resources.layer, "L0"),
          and(eq(resources.layer, "L1"), eq(resources.workspaceId, workspaceId)),
          userId
            ? and(
                eq(resources.layer, "L2"),
                eq(resources.workspaceId, workspaceId),
                eq(resources.userId, userId)
              )
            : sql`false`
        )
      )
    )
    .orderBy(
      sql`CASE ${resources.layer} WHEN 'L2' THEN 0 WHEN 'L1' THEN 1 ELSE 2 END`
    );

  // Deduplicate by name — first occurrence wins (highest layer)
  const seen = new Set<string>();
  return rows.filter((r) => {
    if (seen.has(r.name)) return false;
    seen.add(r.name);
    return true;
  });
}
