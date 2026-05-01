"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, MessageSquare, Zap, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/desks",    label: "Desks",    icon: LayoutGrid },
  { href: "/chat",     label: "Chat",     icon: MessageSquare },
  { href: "/skills",   label: "Skills",   icon: Zap },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 safe-bottom glass border-t border-white/10"
      aria-label="Main navigation"
    >
      <div className="flex h-14 items-center justify-around px-2">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 min-w-[44px] min-h-[44px] justify-center rounded-lg px-3 transition-colors",
                active
                  ? "text-[--color-brand]"
                  : "text-[--color-muted-foreground] hover:text-[--color-foreground]"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 1.75}
                aria-hidden
              />
              <span className="text-[10px] font-medium tracking-wide">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
