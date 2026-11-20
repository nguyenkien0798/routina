"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { Clock3 } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatTaskTime, normalizeTaskTime, DEFAULT_DUE_TIME } from "@/lib/tasks";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  id?: string;
  "aria-label"?: string;
}

interface MenuPosition {
  top: number;
  left: number;
}

const HOURS = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, "0"),
);
const MINUTES = Array.from({ length: 12 }, (_, index) =>
  String(index * 5).padStart(2, "0"),
);

function parseParts(value: string): { hour: string; minute: string } {
  const normalized = normalizeTaskTime(value, DEFAULT_DUE_TIME);
  const [hour, minute] = normalized.split(":");
  const roundedMinute = String(Math.round(Number(minute) / 5) * 5 % 60).padStart(
    2,
    "0",
  );
  return { hour, minute: MINUTES.includes(minute) ? minute : roundedMinute };
}

export function TimePicker({
  value,
  onChange,
  className,
  id,
  "aria-label": ariaLabel,
}: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const hourListRef = useRef<HTMLDivElement>(null);
  const minuteListRef = useRef<HTMLDivElement>(null);
  const parts = useMemo(() => parseParts(value), [value]);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;

    const update = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const menuHeight = menuRef.current?.offsetHeight ?? 280;
      const menuWidth = 220;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < menuHeight + 12 && rect.top > spaceBelow;
      const left = Math.min(
        Math.max(12, rect.left),
        window.innerWidth - menuWidth - 12,
      );
      const rawTop = openUp ? rect.top - menuHeight - 6 : rect.bottom + 6;
      const top = Math.min(
        Math.max(12, rawTop),
        Math.max(12, window.innerHeight - menuHeight - 12),
      );
      setPosition({ top, left });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

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

  useEffect(() => {
    if (!open) return;
    const scrollSelected = (
      container: HTMLDivElement | null,
      selected: string,
    ) => {
      if (!container) return;
      const el = container.querySelector<HTMLElement>(`[data-value="${selected}"]`);
      if (!el) return;
      container.scrollTop = el.offsetTop - container.clientHeight / 2 + el.clientHeight / 2;
    };
    const frame = window.requestAnimationFrame(() => {
      scrollSelected(hourListRef.current, parts.hour);
      scrollSelected(minuteListRef.current, parts.minute);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open, parts.hour, parts.minute]);

  function commit(hour: string, minute: string) {
    onChange(`${hour}:${minute}`);
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        aria-label={ariaLabel ?? "Pick a time"}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-border bg-background/80 px-3 text-left text-sm shadow-[var(--shadow-xs)] transition-[border-color,box-shadow,background-color] duration-150",
          "hover:border-border-strong focus:border-primary/45 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/15",
          open && "border-primary/45 bg-surface ring-2 ring-primary/15",
        )}
      >
        <span className="tabular-nums tracking-[-0.01em]">
          {formatTaskTime(value)}
        </span>
        <Clock3 className="h-4 w-4 shrink-0 text-muted" strokeWidth={1.9} />
      </button>

      {open && position && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              role="dialog"
              aria-label="Choose time"
              style={{
                position: "fixed",
                top: position.top,
                left: position.left,
                width: 220,
              }}
              className="z-[80] overflow-hidden rounded-2xl border border-border bg-surface-elevated p-3 shadow-[var(--shadow-md)] animate-dialog-in"
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <p className="text-[12px] font-medium text-muted">Select time</p>
                <p className="text-[13px] font-semibold tabular-nums tracking-[-0.02em]">
                  {formatTaskTime(`${parts.hour}:${parts.minute}`)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <TimeColumn
                  label="Hour"
                  values={HOURS}
                  selected={parts.hour}
                  listRef={hourListRef}
                  onSelect={(hour) => commit(hour, parts.minute)}
                />
                <TimeColumn
                  label="Min"
                  values={MINUTES}
                  selected={parts.minute}
                  listRef={minuteListRef}
                  onSelect={(minute) => commit(parts.hour, minute)}
                />
              </div>
              <button
                type="button"
                className="mt-3 flex h-9 w-full items-center justify-center rounded-xl bg-primary text-[13px] font-medium text-primary-foreground transition-colors hover:brightness-[1.04]"
                onClick={() => setOpen(false)}
              >
                Done
              </button>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function TimeColumn({
  label,
  values,
  selected,
  onSelect,
  listRef,
}: {
  label: string;
  values: string[];
  selected: string;
  onSelect: (value: string) => void;
  listRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div>
      <p className="mb-1.5 text-center text-[11px] font-medium text-muted">
        {label}
      </p>
      <div
        ref={listRef}
        className="h-44 overflow-y-auto rounded-xl border border-border/80 bg-background/70 p-1"
      >
        {values.map((entry) => {
          const active = entry === selected;
          return (
            <button
              key={entry}
              type="button"
              data-value={entry}
              onClick={() => onSelect(entry)}
              className={cn(
                "flex h-9 w-full items-center justify-center rounded-lg text-[13px] tabular-nums tracking-[-0.01em] transition-colors",
                active
                  ? "bg-primary-soft font-semibold text-primary"
                  : "text-muted hover:bg-surface hover:text-foreground",
              )}
            >
              {entry}
            </button>
          );
        })}
      </div>
    </div>
  );
}
