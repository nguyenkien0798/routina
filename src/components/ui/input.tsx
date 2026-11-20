import type {
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

const fieldClass =
  "w-full rounded-xl border border-border bg-background/80 px-3 text-sm text-foreground shadow-[var(--shadow-xs)] placeholder:text-muted/90 transition-[border-color,box-shadow,background-color] duration-150 hover:border-border-strong focus:border-primary/45 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:opacity-50";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClass, "h-10", className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(fieldClass, "min-h-24 resize-y py-2.5", className)}
      {...props}
    />
  );
}

export function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium tracking-[-0.01em] text-foreground/90">
        {label}
      </span>
      {children}
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </label>
  );
}
