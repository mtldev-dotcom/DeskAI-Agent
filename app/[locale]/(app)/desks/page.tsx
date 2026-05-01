import { and, eq, isNull } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { CreateDeskButton } from "@/components/desk/CreateDeskButton";
import { DeskCard } from "@/components/desk/DeskCard";
import { hasLocale, localizePathname } from "@/i18n/routing";
import { getCurrentUser } from "@/lib/auth/workspace";
import { db } from "@/lib/db/client";
import { resources } from "@/lib/db/schema";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const appLocale = hasLocale(locale) ? locale : "en";
  const t = await getTranslations({ locale: appLocale, namespace: "meta" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function DesksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const appLocale = hasLocale(locale) ? locale : "en";
  const t = await getTranslations({ locale: appLocale, namespace: "desks" });
  const user = await getCurrentUser();

  if (!user) redirect(localizePathname(appLocale, "/sign-in"));
  if (!user.defaultWorkspaceId) redirect(localizePathname(appLocale, "/onboarding"));

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
    <div className="mx-auto max-w-2xl px-4 pt-6 pb-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[--color-foreground]">{t("title")}</h1>
          <p className="mt-0.5 text-sm text-[--color-muted-foreground]">{t("count", { count: desks.length })}</p>
        </div>
        <CreateDeskButton />
      </div>

      {desks.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <p className="text-sm text-[--color-muted-foreground]">{t("empty")}</p>
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
