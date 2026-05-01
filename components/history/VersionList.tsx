"use client";

import { useEffect, useState } from "react";
import { ChevronRight, FileText, User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface ResourceVersion {
  id: string;
  resourceId: string;
  content: any;
  diff: any;
  authorId: string | null;
  note: string | null;
  createdAt: Date;
}

interface VersionListProps {
  resourceId: string;
  onSelectVersion?: (version: ResourceVersion) => void;
  selectedVersionId?: string;
  className?: string;
}

export function VersionList({
  resourceId,
  onSelectVersion,
  selectedVersionId,
  className,
}: VersionListProps) {
  const [versions, setVersions] = useState<ResourceVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const locale = useLocale();
  const t = useTranslations("history");

  useEffect(() => {
    async function loadVersions() {
      try {
        setLoading(true);
        const response = await fetch(`/api/resources/${resourceId}/versions`);
        if (!response.ok) {
          throw new Error(`Failed to load versions: ${response.statusText}`);
        }
        const data = await response.json();
        setVersions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    loadVersions();
  }, [resourceId]);

  if (loading) {
    return <div className={cn("p-4 text-center text-gray-500", className)}>{t("loading")}</div>;
  }

  if (error) {
    return (
      <div className={cn("p-4 text-center text-red-500", className)}>
        {t("errorPrefix")} {error}
      </div>
    );
  }

  if (versions.length === 0) {
    return <div className={cn("p-4 text-center text-gray-500", className)}>{t("noVersions")}</div>;
  }

  return (
    <div className={cn("space-y-2", className)}>
      {versions.map((version) => (
        <button
          key={version.id}
          onClick={() => onSelectVersion?.(version)}
          className={cn(
            "w-full rounded-lg border p-3 text-left transition-colors",
            "hover:bg-white/5 active:bg-white/10",
            selectedVersionId === version.id ? "border-blue-500 bg-blue-500/10" : "border-white/10"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                {version.authorId ? <User className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{version.note || t("updateFallback")}</p>
              <p className="text-xs text-gray-400">
                {new Date(version.createdAt).toLocaleString(locale === "fr" ? "fr-CA" : "en-CA", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
          </div>
        </button>
      ))}
    </div>
  );
}
