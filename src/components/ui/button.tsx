import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-[var(--shadow-xs)] hover:brightness-[1.04] active:brightness-[0.97] disabled:opacity-45",
  secondary:
    "bg-lime text-lime-ink border border-border shadow-[var(--shadow-xs)] hover:brightness-[1.02] active:brightness-[0.98] disabled:opacity-45",
  ghost:
    "text-muted hover:bg-background/90 hover:text-foreground active:bg-border/40 disabled:opacity-45",
  danger:
    "bg-danger text-white shadow-[var(--shadow-xs)] hover:brightness-[1.04] active:brightness-[0.96] disabled:opacity-45",
  outline:
    "border border-border bg-surface text-foreground shadow-[var(--shadow-xs)] hover:bg-background disabled:opacity-45",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs rounded-[11px] gap-1.5",
  md: "h-10 px-4 text-sm rounded-[13px] gap-2",
  lg: "h-11 px-5 text-sm rounded-[14px] gap-2",
  icon: "h-9 w-9 rounded-[12px]",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant = "primary",
      size = "md",
      type = "button",
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center font-medium tracking-[-0.01em] transition-[background-color,border-color,color,box-shadow,filter,transform] duration-150 ease-out",
          "active:scale-[0.98] disabled:pointer-events-none disabled:active:scale-100",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      />
    );
  },
);
