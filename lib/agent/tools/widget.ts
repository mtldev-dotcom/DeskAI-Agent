import { db } from "@/lib/db/client";
import { resources, widgetInstances } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { generateId } from "@/lib/utils";
import { createResourceVersion } from "@/lib/db/versions";
import type { OpenRouterTool } from "../openrouter-client";

export const widgetTools: OpenRouterTool[] = [
  {
    type: "function",
    function: {
      name: "widget.add",
      description: "Add a widget to a Desk",
      parameters: {
        type: "object",
        properties: {
          deskId: { type: "string" },
          type: {
            type: "string",
            enum: ["markdown", "kanban", "browser", "code", "chart", "form", "iframe", "todo", "richtext", "whiteboard"],
            description: "Widget type",
          },
          name: { type: "string", description: "Human-readable label for this widget instance" },
          props: { type: "object", description: "Initial widget props (type-specific)" },
          layout: {
            type: "object",
            description: "Grid position: { x, y, w, h }",
            properties: {
              x: { type: "number" },
              y: { type: "number" },
              w: { type: "number" },
              h: { type: "number" },
            },
          },
        },
        required: ["deskId", "type", "name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "widget.patch",
      description: "Update a widget's props, name, or layout",
      parameters: {
        type: "object",
        properties: {
          widgetInstanceId: { type: "string" },
          name: { type: "string" },
          props: { type: "object" },
          layout: { type: "object" },
        },
        required: ["widgetInstanceId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "widget.remove",
      description: "Remove a widget from a Desk",
      parameters: {
        type: "object",
        properties: {
          widgetInstanceId: { type: "string" },
          deskId: { type: "string" },
        },
        required: ["widgetInstanceId", "deskId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "widget.list",
      description: "List all widgets on a Desk",
      parameters: {
        type: "object",
        properties: { deskId: { type: "string" } },
        required: ["deskId"],
      },
    },
  },
];

export async function handleWidgetTool(
  name: string,
  args: Record<string, unknown>,
  context: { workspaceId: string; userId: string }
): Promise<unknown> {
  if (name === "widget.list") {
    return db
      .select()
      .from(widgetInstances)
      .where(eq(widgetInstances.deskId, String(args.deskId)));
  }

  if (name === "widget.add") {
    const instanceId = generateId();
    const defaultLayout = { x: 0, y: 9999, w: 6, h: 6 };
    const layout = { ...defaultLayout, ...(args.layout as Record<string, number> ?? {}) };

    const [instance] = await db
      .insert(widgetInstances)
      .values({
        id: instanceId,
        deskId: String(args.deskId),
        props: {
          type: String(args.type),
          name: String(args.name),
          ...(args.props as Record<string, unknown> ?? {}),
        },
        layout,
      })
      .returning();

    // Update desk's widgetIds list
    const [desk] = await db
      .select()
      .from(resources)
      .where(eq(resources.id, String(args.deskId)))
      .limit(1);

    if (desk) {
      const content = desk.content as Record<string, unknown>;
      const widgetIds = Array.isArray(content.widgetIds) ? content.widgetIds : [];
      await db
        .update(resources)
        .set({ content: { ...content, widgetIds: [...widgetIds, instanceId] }, updatedAt: new Date() })
        .where(eq(resources.id, String(args.deskId)));

      // Create version for the desk resource
      await createResourceVersion({
        resourceId: String(args.deskId),
        authorId: context.userId,
        note: `Widget added: ${String(args.name)} (${String(args.type)})`,
      });
    }

    return { widgetInstanceId: instanceId, type: args.type, name: args.name };
  }

  if (name === "widget.patch") {
    const [existing] = await db
      .select()
      .from(widgetInstances)
      .where(eq(widgetInstances.id, String(args.widgetInstanceId)))
      .limit(1);

    if (!existing) throw new Error(`Widget instance ${args.widgetInstanceId} not found`);

    const updates: Partial<typeof widgetInstances.$inferInsert> = { updatedAt: new Date() };
    if (args.props) {
      updates.props = { ...(existing.props as Record<string, unknown>), ...(args.props as Record<string, unknown>) };
    }
    if (args.layout) {
      updates.layout = { ...(existing.layout as Record<string, unknown>), ...(args.layout as Record<string, unknown>) };
    }

    await db
      .update(widgetInstances)
      .set(updates)
      .where(eq(widgetInstances.id, String(args.widgetInstanceId)));

    return { ok: true, widgetInstanceId: args.widgetInstanceId };
  }

  if (name === "widget.remove") {
    await db
      .delete(widgetInstances)
      .where(eq(widgetInstances.id, String(args.widgetInstanceId)));

    // Remove from desk widgetIds
    const [desk] = await db
      .select()
      .from(resources)
      .where(eq(resources.id, String(args.deskId)))
      .limit(1);

    if (desk) {
      const content = desk.content as Record<string, unknown>;
      const widgetIds = (Array.isArray(content.widgetIds) ? content.widgetIds : []) as string[];
      await db
        .update(resources)
        .set({
          content: { ...content, widgetIds: widgetIds.filter((id) => id !== args.widgetInstanceId) },
          updatedAt: new Date(),
        })
        .where(eq(resources.id, String(args.deskId)));

      // Create version for the desk resource
      await createResourceVersion({
        resourceId: String(args.deskId),
        authorId: context.userId,
        note: `Widget removed: ${args.widgetInstanceId}`,
      });
    }

    return { ok: true };
  }

  throw new Error(`Unknown widget tool: ${name}`);
}
