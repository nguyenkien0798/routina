import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 overflow-hidden rounded-[24px] border border-border bg-surface px-5 py-5 shadow-[var(--shadow-sm)] sm:px-6 sm:py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2.5 h-1.5 w-12 rounded-full bg-primary/70" />
          <h1 className="font-display text-[2rem] leading-[1.05] font-bold tracking-[-0.04em] sm:text-[2.35rem]">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}
