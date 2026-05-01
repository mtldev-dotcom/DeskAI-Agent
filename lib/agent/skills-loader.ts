import matter from "gray-matter";
import { resolveAllResources } from "@/lib/db/layers";
import type { Resource } from "@/lib/db/schema";

export type SkillPlacement = "system" | "history" | "transient";

export interface LoadedSkill {
  id: string;
  name: string;
  placement: SkillPlacement;
  body: string;
  layer: string;
}

interface SkillContent {
  body: string;
}

interface SkillMetadata {
  placement?: SkillPlacement;
  loaded?: string;
  when?: string | null;
}

interface SkillContext {
  deskId?: string;
  channel?: string;
  recentMessageCount?: number;
  activeWidgetTypes?: string[];
}

function parsePlacement(raw: unknown): SkillPlacement {
  if (raw === "history" || raw === "transient") return raw;
  return "system";
}

function evaluateWhen(when: string | null | undefined, ctx: SkillContext): boolean {
  if (!when) return true;

  // Simple tag-based evaluation: "channel:telegram", "always", "desk:<id>"
  const conditions = when
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const condition of conditions) {
    if (condition === "always") return true;
    if (condition === "never") return false;
    if (condition.startsWith("channel:")) {
      const ch = condition.slice(8);
      if (ch === ctx.channel) return true;
    }
    if (condition.startsWith("desk:")) {
      const id = condition.slice(5);
      if (id === ctx.deskId) return true;
    }
    if (condition.startsWith("widget:")) {
      const wt = condition.slice(7);
      if (ctx.activeWidgetTypes?.includes(wt)) return true;
    }
  }
  return false;
}

/**
 * Loads all active skills for the current context, resolving layers.
 * Returns skills grouped by placement for use in prompt-builder.
 */
export async function loadSkills(
  workspaceId: string,
  userId: string,
  ctx: SkillContext = {}
): Promise<{ system: LoadedSkill[]; history: LoadedSkill[]; transient: LoadedSkill[] }> {
  const resources = await resolveAllResources("skill", { workspaceId, userId });

  const result: { system: LoadedSkill[]; history: LoadedSkill[]; transient: LoadedSkill[] } = {
    system: [],
    history: [],
    transient: [],
  };

  for (const resource of resources) {
    const content = resource.content as SkillContent;
    const metadata = resource.metadata as SkillMetadata;

    // Skills can store body in content.body or be parsed from frontmatter markdown
    let body = content.body ?? "";
    let frontmatter: SkillMetadata = metadata ?? {};

    // If the body looks like a markdown doc with frontmatter, re-parse
    if (body.startsWith("---")) {
      const parsed = matter(body);
      body = parsed.content.trim();
      frontmatter = { ...frontmatter, ...(parsed.data as SkillMetadata) };
    }

    const loaded = String(frontmatter.loaded ?? "always").toLowerCase();
    if (loaded === "never") continue;

    const when = frontmatter.when;
    if (!evaluateWhen(when, ctx)) continue;

    const placement = parsePlacement(frontmatter.placement);

    result[placement].push({
      id: resource.id,
      name: resource.name,
      placement,
      body,
      layer: resource.layer,
    });
  }

  return result;
}
