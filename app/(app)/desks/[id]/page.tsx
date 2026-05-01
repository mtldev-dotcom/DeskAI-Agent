import { notFound, redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { AgentOverlay } from "@/components/agent/AgentOverlay";
import { GlassSurface } from "@/components/visual/GlassSurface";
import { getCurrentUser } from "@/lib/auth/workspace";
import { db } from "@/lib/db/client";
import { resources, widgetInstances } from "@/lib/db/schema";

interface DeskPageProps {
  params: Promise<{ id: string }>;
}

interface WidgetProps {
  name?: string;
  type?: string;
}

export default async function DeskPage({ params }: DeskPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user?.defaultWorkspaceId) redirect("/onboarding");

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

  const widgets = await db
    .select()
    .from(widgetInstances)
    .where(eq(widgetInstances.deskId, desk.id));

  return (
    <div className="min-h-dvh px-4 pb-24 pt-5 md:pr-[420px]">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-[--color-foreground]">{desk.name}</h1>
          <p className="mt-1 text-sm text-[--color-muted-foreground]">
            {widgets.length} widget{widgets.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {widgets.length ? (
            widgets.map((widget) => {
              const props = widget.props as WidgetProps;
              return (
                <GlassSurface key={widget.id} className="min-h-36 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="truncate text-sm font-semibold text-[--color-foreground]">
                      {props.name ?? "Widget"}
                    </h2>
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-[--color-muted-foreground]">
                      {props.type ?? "custom"}
                    </span>
                  </div>
                  <pre className="mt-3 max-h-28 overflow-auto whitespace-pre-wrap break-words text-xs text-[--color-muted-foreground]">
                    {JSON.stringify(widget.props, null, 2)}
                  </pre>
                </GlassSurface>
              );
            })
          ) : (
            <GlassSurface className="min-h-60 p-5 md:col-span-2">
              <div className="h-full rounded-lg border border-dashed border-white/10 bg-white/[0.03]" />
            </GlassSurface>
          )}
        </div>
      </div>

      <AgentOverlay deskId={desk.id} />
    </div>
  );
}
