import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

interface GlassSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export function GlassSurface({ className, elevated, ...props }: GlassSurfaceProps) {
  return (
    <div
      className={cn(
        "glass rounded-xl",
        elevated && "shadow-lg shadow-black/20",
        className
      )}
      {...props}
    />
  );
}
