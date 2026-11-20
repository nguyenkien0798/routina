import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function SectionHeading({
  eyebrow,
  title,
  action,
  tone = "moss",
  className,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
  tone?: "moss" | "sand" | "ink";
  className?: string;
}) {
  const bar =
    tone === "sand"
      ? "bg-accent"
      : tone === "ink"
        ? "bg-foreground/70"
        : "bg-primary";

  return (
    <div className={cn("mb-4 flex items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <span className={cn("h-1.5 w-5 rounded-full", bar)} />
          <p className="text-[11px] font-medium tracking-[0.08em] text-muted uppercase">
            {eyebrow}
          </p>
        </div>
        <h2 className="font-display mt-1.5 text-[1.4rem] leading-tight font-semibold tracking-[-0.03em] sm:text-[1.55rem]">
          {title}
        </h2>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
