import { defineRouting } from "next-intl/routing";

export const locales = ["en", "fr"] as const;
export type AppLocale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export function hasLocale(value: string): value is AppLocale {
  return locales.includes(value as AppLocale);
}

export function stripLocalePrefix(pathname: string) {
  if (pathname === "/fr") return "/";
  return pathname.replace(/^\/fr(?=\/|$)/, "") || "/";
}

export function localizePathname(locale: AppLocale, pathname: string) {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const stripped = stripLocalePrefix(normalized);
  if (locale === routing.defaultLocale) return stripped;
  return stripped === "/" ? `/${locale}` : `/${locale}${stripped}`;
}
