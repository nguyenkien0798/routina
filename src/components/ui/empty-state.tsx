import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  className,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[28px] border border-border bg-surface px-6 py-16 text-center shadow-[var(--shadow-sm)] sm:px-10 sm:py-18",
        className,
      )}
    >
      <div
        aria-hidden
        className="animate-bob pointer-events-none absolute top-8 right-8 h-16 w-16 rounded-[18px] bg-lime/80"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-14 right-24 h-10 w-10 rotate-12 rounded-full bg-accent/25"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-10 left-8 h-12 w-12 -rotate-6 rounded-[14px] bg-primary/15"
      />

      <div className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-[18px] bg-primary text-primary-foreground shadow-[var(--shadow-xs)]">
        {icon}
      </div>
      <h2 className="font-display relative text-[1.7rem] font-bold tracking-[-0.035em] sm:text-[1.9rem]">
        {title}
      </h2>
      <p className="relative mx-auto mt-2.5 max-w-md text-[15px] leading-relaxed text-muted">
        {description}
      </p>
      {actionLabel || secondaryLabel ? (
        <div className="relative mt-7 flex flex-wrap items-center justify-center gap-2.5">
          {actionLabel && onAction ? (
            <Button onClick={onAction}>{actionLabel}</Button>
          ) : null}
          {secondaryLabel && onSecondary ? (
            <Button variant="secondary" onClick={onSecondary}>
              {secondaryLabel}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
