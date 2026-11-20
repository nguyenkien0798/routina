import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-[20px] border border-border/80 bg-surface/95 card-shadow",
        className,
      )}
      {...props}
    />
  );
}
