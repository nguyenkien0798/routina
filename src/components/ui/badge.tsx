import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Badge({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-border/80 bg-background/80 px-1.5 py-0.5 text-[11px] font-medium tracking-[-0.01em] text-muted",
        className,
      )}
      style={style}
    >
      {children}
    </span>
  );
}
