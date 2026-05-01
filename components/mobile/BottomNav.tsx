"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { LayoutGrid, MessageSquare, Settings, Zap } from "lucide-react";
import { hasLocale, localizePathname, stripLocalePrefix } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/desks", key: "desks", icon: LayoutGrid },
  { href: "/chat", key: "chat", icon: MessageSquare },
  { href: "/skills", key: "skills", icon: Zap },
  { href: "/settings", key: "settings", icon: Settings },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("nav");
  const activePath = stripLocalePrefix(pathname);
  const appLocale = hasLocale(locale) ? locale : "en";

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 safe-bottom glass border-t border-white/10"
      aria-label={t("mainNavigation")}
    >
      <div className="flex h-14 items-center justify-around px-2">
        {tabs.map(({ href, key, icon: Icon }) => {
          const active = activePath.startsWith(href);
          return (
            <Link
              key={href}
              href={localizePathname(appLocale, href)}
              className={cn(
                "flex flex-col items-center gap-0.5 min-w-[44px] min-h-[44px] justify-center rounded-lg px-3 transition-colors",
                active
                  ? "text-[--color-brand]"
                  : "text-[--color-muted-foreground] hover:text-[--color-foreground]"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.75} aria-hidden />
              <span className="text-[10px] font-medium tracking-wide">{t(key)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
