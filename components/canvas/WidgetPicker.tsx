"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { WIDGET_DEFINITIONS, type WidgetCategory } from "@/lib/widgets/defaults";
import type { DeskWidget, WidgetType, WidgetLayout } from "@/lib/types";

const WIDGET_ICONS: Record<string, string> = {
  CheckSquare: "☑",
  Columns: "⊞",
  Briefcase: "💼",
  FileText: "📝",
  Type: "T",
  PenLine: "✏",
  Code2: "</>",
  Globe: "🌐",
};

interface WidgetPickerProps {
  deskId: string;
  onAdd: (widget: DeskWidget) => void;
  onClose: () => void;
}

type CategoryFilter = "all" | WidgetCategory;

export function WidgetPicker({ deskId, onAdd, onClose }: WidgetPickerProps) {
  const t = useTranslations("widgetPicker");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [addingType, setAddingType] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null);

  const categories: { key: CategoryFilter; label: string }[] = [
    { key: "all", label: t("categories.all") },
    { key: "productivity", label: t("categories.productivity") },
    { key: "content", label: t("categories.content") },
    { key: "web", label: t("categories.web") },
  ];

  const visible = activeCategory === "all"
    ? WIDGET_DEFINITIONS
    : WIDGET_DEFINITIONS.filter((d) => d.category === activeCategory);

  async function handleAdd(defType: string) {
    if (addingType) return;
    setAddingType(defType);
    setErrorType(null);

    const def = WIDGET_DEFINITIONS.find((d) => d.type === defType);
    if (!def) {
      setAddingType(null);
      return;
    }

    const widgetKey = defType as keyof typeof t;
    let label = defType;
    try {
      label = t(`widgets.${defType}.label` as Parameters<typeof t>[0]);
    } catch {
      label = def.label;
    }

    try {
      const res = await fetch("/api/widgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deskId,
          type: def.resolvedType,
          name: def.label,
          props: def.defaultProps,
          layout: { x: 0, y: 9999, ...def.defaultLayout },
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      const data = (await res.json()) as {
        id: string;
        type: string;
        name: string;
        props: Record<string, unknown>;
        layout: { x: number; y: number; w: number; h: number };
      };

      const newWidget: DeskWidget = {
        id: data.id,
        type: data.type as WidgetType | "custom",
        name: label,
        props: data.props,
        layout: data.layout as WidgetLayout,
      };

      onAdd(newWidget);
      onClose();
    } catch {
      setErrorType(defType);
      setAddingType(null);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("title")}
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/10 bg-[--color-background] shadow-2xl shadow-black/40"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2">
            <Plus size={16} className="text-[--color-muted-foreground]" />
            <h2 className="text-base font-semibold text-[--color-foreground]">{t("title")}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="flex h-8 w-8 items-center justify-center rounded-md text-[--color-muted-foreground] hover:bg-white/5 hover:text-[--color-foreground]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 border-b border-white/10 px-4 pt-3 pb-2">
          {categories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setActiveCategory(cat.key)}
              className={cn(
                "rounded-full px-3 py-1 text-sm transition-colors",
                activeCategory === cat.key
                  ? "bg-white/10 text-[--color-foreground]"
                  : "text-[--color-muted-foreground] hover:bg-white/5 hover:text-[--color-foreground]"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Widget grid */}
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4 max-h-[60vh] overflow-y-auto">
          {visible.map((def) => {
            const isAdding = addingType === def.type;
            const hasError = errorType === def.type;
            let widgetLabel = def.label;
            let widgetDesc = def.description;
            try {
              widgetLabel = t(`widgets.${def.type}.label` as Parameters<typeof t>[0]);
              widgetDesc = t(`widgets.${def.type}.description` as Parameters<typeof t>[0]);
            } catch {
              // fallback to default
            }

            return (
              <button
                key={def.type}
                type="button"
                disabled={!!addingType}
                onClick={() => handleAdd(def.type)}
                className={cn(
                  "group flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-all",
                  hasError
                    ? "border-red-500/30 bg-red-500/5"
                    : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.07]",
                  addingType && !isAdding && "opacity-50"
                )}
              >
                <div className="flex w-full items-center justify-between">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-md bg-white/5 text-sm font-mono text-[--color-muted-foreground]"
                    aria-hidden="true"
                  >
                    {WIDGET_ICONS[def.icon] ?? def.icon.slice(0, 2)}
                  </span>
                  {isAdding && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                  )}
                  {hasError && (
                    <span className="text-xs text-red-400">{t("errorAdding")}</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-[--color-foreground]">{widgetLabel}</p>
                  <p className="mt-0.5 text-xs text-[--color-muted-foreground] line-clamp-2">{widgetDesc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
