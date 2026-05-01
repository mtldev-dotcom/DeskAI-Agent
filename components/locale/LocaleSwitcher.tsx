"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { hasLocale, localizePathname, stripLocalePrefix, type AppLocale } from "@/i18n/routing";

export function LocaleSwitcher() {
  const t = useTranslations("locale");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function toggle() {
    const currentLocale: AppLocale = hasLocale(locale) ? locale : "en";
    const nextLocale: AppLocale = currentLocale === "en" ? "fr" : "en";
    router.push(localizePathname(nextLocale, stripLocalePrefix(pathname)));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="min-h-[44px] rounded-lg px-3 text-sm text-white/60 transition-colors hover:text-white"
    >
      {t("switch")}
    </button>
  );
}
