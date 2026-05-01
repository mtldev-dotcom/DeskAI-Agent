import { db } from "@/lib/db/client";
import { resources, widgetInstances } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateId } from "@/lib/utils";
import { createResourceVersion } from "@/lib/db/versions";
import type { DeskExport } from "./export";

export interface ImportResult {
  deskId: string;
  widgetCount: number;
  skillCount: number;
  importedAt: string;
}

export async function importDesk(
  exportData: DeskExport,
  workspaceId: string,
  userId: string,
  importAsNew: boolean = false
): Promise<ImportResult> {
  const { desk: deskData, skills: skillData } = exportData;
  const widgetData = deskData.widgets;

  // Start a transaction
  const result = await db.transaction(async (tx) => {
    // Import or update desk
    const deskId = importAsNew ? generateId() : deskData.id;
    
    const existingDesk = await tx
      .select()
      .from(resources)
      .where(eq(resources.id, deskId))
      .limit(1);

    if (existingDesk[0]) {
      // Update existing desk
      await tx
        .update(resources)
        .set({
          name: deskData.name,
          content: deskData.content,
          metadata: deskData.metadata,
          updatedAt: new Date(),
        })
        .where(eq(resources.id, deskId));
    } else {
      // Create new desk
      await tx.insert(resources).values({
        id: deskId,
        workspaceId,
        userId,
        layer: "L2",
        kind: "desk",
        name: deskData.name,
        content: deskData.content,
        metadata: deskData.metadata,
      });
    }

    // Create version for the desk
    await createResourceVersion({
      resourceId: deskId,
      authorId: userId,
      note: importAsNew ? "Desk imported" : "Desk updated via import",
    });

    // Import widgets
    const widgetIds = new Set<string>();
    for (const widget of widgetData) {
      const widgetId = generateId();
      await tx.insert(widgetInstances).values({
        id: widgetId,
        deskId,
        resourceId: null, // Widget instances reference resources table
        props: widget.props,
        layout: widget.layout,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      widgetIds.add(widgetId);
    }

    // Import skills (only if they don't already exist)
    const skillIds = new Set<string>();
    for (const skill of skillData) {
      // Check if skill with same name already exists in this workspace
      const existingSkill = await tx
        .select()
        .from(resources)
        .where(eq(resources.name, skill.name))
        .limit(1);

      if (!existingSkill[0]) {
        const skillId = generateId();
        await tx.insert(resources).values({
          id: skillId,
          workspaceId,
          userId,
          layer: "L2",
          kind: "skill",
          name: skill.name,
          content: skill.content,
          metadata: {
            ...skill.metadata,
            placement: skill.placement,
            when: skill.when,
            loaded: "always",
          },
        });
        skillIds.add(skillId);

        // Create version for the skill
        await createResourceVersion({
          resourceId: skillId,
          authorId: userId,
          note: "Skill imported",
        });
      }
    }

    return {
      deskId,
      widgetCount: widgetIds.size,
      skillCount: skillIds.size,
      importedAt: new Date().toISOString(),
    };
  });

  return result;
}