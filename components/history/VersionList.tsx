"use client";

import { useState, useEffect } from "react";
import { ChevronRight, User, FileText } from "lucide-react";
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
    return (
      <div className={cn("p-4 text-center text-gray-500", className)}>
        Loading history...
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("p-4 text-center text-red-500", className)}>
        Error: {error}
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className={cn("p-4 text-center text-gray-500", className)}>
        No version history yet.
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {versions.map((version) => (
        <button
          key={version.id}
          onClick={() => onSelectVersion?.(version)}
          className={cn(
            "w-full text-left p-3 rounded-lg border transition-colors",
            "hover:bg-white/5 active:bg-white/10",
            selectedVersionId === version.id
              ? "border-blue-500 bg-blue-500/10"
              : "border-white/10"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                {version.authorId ? (
                  <User className="w-4 h-4" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {version.note || "Update"}
              </p>
              <p className="text-xs text-gray-400">
                {new Date(version.createdAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </div>
        </button>
      ))}
    </div>
  );
}