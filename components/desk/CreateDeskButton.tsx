"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { hasLocale, localizePathname } from "@/i18n/routing";

export function CreateDeskButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("desks");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    startTransition(async () => {
      const appLocale = hasLocale(locale) ? locale : "en";
      const res = await fetch("/api/desks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (res.ok) {
        const { id } = await res.json();
        setName("");
        setOpen(false);
        router.refresh();
        router.push(localizePathname(appLocale, `/desks/${id}`));
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-[--color-brand] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[--color-brand]/20 transition-opacity hover:opacity-90 min-h-[44px]"
      >
        <Plus size={18} />
        {t("new")}
      </button>
    );
  }

  return (
    <form onSubmit={handleCreate} className="flex items-center gap-2">
      <input
        autoFocus
        type="text"
        placeholder={t("namePlaceholder")}
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="glass rounded-lg px-3 py-2 text-sm text-[--color-foreground] placeholder-[--color-muted-foreground] outline-none focus:ring-1 focus:ring-[--color-brand] min-h-[44px] w-44"
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
      />
      <button
        type="submit"
        disabled={isPending || !name.trim()}
        className="rounded-lg bg-[--color-brand] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 min-h-[44px]"
      >
        {isPending ? "..." : t("create")}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="rounded-lg px-3 py-2 text-sm text-[--color-muted-foreground] hover:text-[--color-foreground] min-h-[44px]"
      >
        {t("cancel")}
      </button>
    </form>
  );
}
