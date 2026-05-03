import { and, eq, isNull } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { AgentOverlay } from "@/components/agent/AgentOverlay";
import { DeskCanvas } from "@/components/canvas/DeskCanvas";
import { hasLocale, localizePathname } from "@/i18n/routing";
import { getCurrentUser } from "@/lib/auth/workspace";
import { db } from "@/lib/db/client";
import { resources, widgetInstances } from "@/lib/db/schema";
import type { DeskWidget, WidgetLayout, WidgetType } from "@/lib/types";

interface DeskPageProps {
  params: Promise<{ id: string; locale: string }>;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function isWidgetType(value: unknown): value is WidgetType {
  return (
    value === "markdown" ||
    value === "kanban" ||
    value === "browser" ||
    value === "code" ||
    value === "chart" ||
    value === "form" ||
    value === "iframe" ||
    value === "todo" ||
    value === "richtext" ||
    value === "whiteboard"
  );
}

function toNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function parseLayout(value: unknown, index: number): WidgetLayout {
  const layout = asRecord(value);
  return {
    x: toNumber(layout.x, 0),
    y: toNumber(layout.y, index * 6),
    w: toNumber(layout.w, 6),
    h: toNumber(layout.h, 5),
    ...(typeof layout.minW === "number" ? { minW: layout.minW } : {}),
    ...(typeof layout.minH === "number" ? { minH: layout.minH } : {}),
  };
}

export default async function DeskPage({ params }: DeskPageProps) {
  const { id, locale } = await params;
  const appLocale = hasLocale(locale) ? locale : "en";
  const user = await getCurrentUser();

  if (!user) redirect(localizePathname(appLocale, "/sign-in"));
  if (!user.defaultWorkspaceId) redirect(localizePathname(appLocale, "/onboarding"));

  const [desk] = await db
    .select()
    .from(resources)
    .where(
      and(
        eq(resources.id, id),
        eq(resources.workspaceId, user.defaultWorkspaceId),
        eq(resources.kind, "desk"),
        isNull(resources.archivedAt)
      )
    )
    .limit(1);

  if (!desk) notFound();

  const widgets = await db.select().from(widgetInstances).where(eq(widgetInstances.deskId, desk.id));

  const canvasWidgets: DeskWidget[] = widgets.map((widget, index) => {
    const props = asRecord(widget.props);
    const type = isWidgetType(props.type) ? props.type : "custom";
    const name = typeof props.name === "string" ? props.name : "Widget";

    return {
      id: widget.id,
      type,
      name,
      props,
      layout: parseLayout(widget.layout, index),
    };
  });

  return (
    <div className="h-dvh overflow-hidden">
      <DeskCanvas deskId={desk.id} deskName={desk.name} widgets={canvasWidgets} />
      <AgentOverlay deskId={desk.id} />
    </div>
  );
}
