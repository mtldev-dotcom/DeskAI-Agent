import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { resources } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { DeskCard } from "@/components/desk/DeskCard";
import { CreateDeskButton } from "@/components/desk/CreateDeskButton";
import { getCurrentUser } from "@/lib/auth/workspace";

export default async function DesksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user || !user.defaultWorkspaceId) redirect("/onboarding");

  const desks = await db
    .select()
    .from(resources)
    .where(
      and(
        eq(resources.kind, "desk"),
        eq(resources.workspaceId, user.defaultWorkspaceId),
        isNull(resources.archivedAt)
      )
    )
    .orderBy(resources.updatedAt);

  return (
    <div className="px-4 pt-6 pb-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[--color-foreground]">Desks</h1>
          <p className="text-sm text-[--color-muted-foreground] mt-0.5">
            {desks.length} desk{desks.length !== 1 ? "s" : ""}
          </p>
        </div>
        <CreateDeskButton />
      </div>

      {desks.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <p className="text-[--color-muted-foreground] text-sm">
            No desks yet. Create your first desk to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {desks.map((desk) => (
            <DeskCard key={desk.id} desk={desk} />
          ))}
        </div>
      )}
    </div>
  );
}
