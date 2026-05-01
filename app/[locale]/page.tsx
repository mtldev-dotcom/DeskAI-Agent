import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { hasLocale, localizePathname } from "@/i18n/routing";

export default async function LocalizedRootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(locale)) {
    redirect("/sign-in");
  }

  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    redirect(localizePathname(locale, "/desks"));
  }

  redirect(localizePathname(locale, "/sign-in"));
}
