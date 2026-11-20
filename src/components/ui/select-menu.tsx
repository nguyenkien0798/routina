"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectMenuProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
}

interface MenuPosition {
  top: number;
  left: number;
  width: number;
}

export function SelectMenu({
  value,
  onChange,
  options,
  placeholder = "Select",
  className,
  buttonClassName,
  disabled,
  id,
  "aria-label": ariaLabel,
}: SelectMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((option) => option.value === value);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;

    const update = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const menuHeight = menuRef.current?.offsetHeight ?? 240;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < menuHeight + 12 && rect.top > spaceBelow;
      setPosition({
        top: openUp ? rect.top - menuHeight - 6 : rect.bottom + 6,
        left: rect.left,
        width: rect.width,
      });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, options.length]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-border bg-background/80 px-3 text-left text-sm shadow-[var(--shadow-xs)] transition-[border-color,box-shadow,background-color] duration-150",
          "hover:border-border-strong focus:border-primary/45 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/15",
          "disabled:cursor-not-allowed disabled:opacity-50",
          open && "border-primary/45 bg-surface ring-2 ring-primary/15",
          buttonClassName,
        )}
      >
        <span className={cn("truncate", !selected && "text-muted")}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted transition-transform duration-150",
            open && "rotate-180",
          )}
        />
      </button>

      {open && position && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              id={listId}
              role="listbox"
              style={{
                position: "fixed",
                top: position.top,
                left: position.left,
                width: position.width,
              }}
              className="z-[80] overflow-hidden rounded-xl border border-border bg-surface-elevated p-1 shadow-[var(--shadow-md)] animate-dialog-in"
            >
              <ul className="max-h-60 overflow-y-auto">
                {options.map((option) => {
                  const active = option.value === value;
                  return (
                    <li key={option.value}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={active}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors duration-100",
                          active
                            ? "bg-primary-soft font-medium text-primary"
                            : "text-foreground hover:bg-background",
                        )}
                        onClick={() => {
                          onChange(option.value);
                          setOpen(false);
                        }}
                      >
                        <span className="truncate">{option.label}</span>
                        {active ? (
                          <Check className="h-3.5 w-3.5 shrink-0" />
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
