"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  parseLocalDate,
  todayString,
  toLocalDateString,
  weekdayOrder,
} from "@/lib/dates";
import type { WeekStartsOn } from "@/types";
import { WEEKDAY_LABELS } from "@/lib/constants";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  max?: string;
  min?: string;
  weekStartsOn?: WeekStartsOn;
  className?: string;
  id?: string;
  placeholder?: string;
  clearable?: boolean;
}

interface MenuPosition {
  top: number;
  left: number;
}

export function DatePicker({
  value,
  onChange,
  max,
  min,
  weekStartsOn = 1,
  className,
  id,
  placeholder = "Pick a date",
  clearable = false,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selectedDate = value ? parseLocalDate(value) : null;
  const [viewMonth, setViewMonth] = useState(
    () => selectedDate ?? parseLocalDate(todayString()),
  );
  const today = todayString();
  const days = weekdayOrder(weekStartsOn);

  useEffect(() => {
    if (!open) return;
    setViewMonth(value ? parseLocalDate(value) : parseLocalDate(todayString()));
  }, [open, value]);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;

    const update = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const menuHeight = menuRef.current?.offsetHeight ?? 340;
      const menuWidth = 304;
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
  }, [open, viewMonth]);

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

  const weeks = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn });
    const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn });
    const all = eachDayOfInterval({ start, end });
    const rows: Date[][] = [];
    for (let i = 0; i < all.length; i += 7) {
      rows.push(all.slice(i, i + 7));
    }
    return rows;
  }, [viewMonth, weekStartsOn]);

  function isDisabled(date: Date): boolean {
    const key = toLocalDateString(date);
    if (min && key < min) return true;
    if (max && key > max) return true;
    return false;
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-border bg-background/80 px-3 text-left text-sm shadow-[var(--shadow-xs)] transition-[border-color,box-shadow,background-color] duration-150",
          "hover:border-border-strong focus:border-primary/45 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/15",
          open && "border-primary/45 bg-surface ring-2 ring-primary/15",
        )}
      >
        <span className={cn("truncate", !value && "text-muted")}>
          {value ? format(parseLocalDate(value), "MMM d, yyyy") : placeholder}
        </span>
        <CalendarDays className="h-4 w-4 shrink-0 text-muted" />
      </button>

      {open && position && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              style={{
                position: "fixed",
                top: position.top,
                left: position.left,
                width: 304,
              }}
              className="z-[80] overflow-hidden rounded-2xl border border-border bg-surface-elevated p-3 shadow-[var(--shadow-md)] animate-dialog-in"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold tracking-[-0.015em]">
                  {format(viewMonth, "MMMM yyyy")}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Previous month"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-background hover:text-foreground"
                    onClick={() => setViewMonth((current) => subMonths(current, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next month"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-background hover:text-foreground"
                    onClick={() => setViewMonth((current) => addMonths(current, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mb-1 grid grid-cols-7 gap-1">
                {days.map((day) => (
                  <span
                    key={day}
                    className="py-1 text-center text-[11px] font-medium text-muted"
                  >
                    {WEEKDAY_LABELS[day].short.slice(0, 2)}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {weeks.flat().map((date) => {
                  const key = toLocalDateString(date);
                  const inMonth = isSameMonth(date, viewMonth);
                  const selected = selectedDate
                    ? isSameDay(date, selectedDate)
                    : false;
                  const isToday = key === today;
                  const disabled = isDisabled(date);

                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        onChange(key);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl text-[13px] tabular-nums transition-colors duration-100",
                        !inMonth && "text-muted/45",
                        inMonth && !selected && "text-foreground hover:bg-background",
                        isToday && !selected && "ring-1 ring-primary/30",
                        selected &&
                          "bg-primary font-semibold text-primary-foreground shadow-[var(--shadow-xs)]",
                        disabled &&
                          "cursor-not-allowed opacity-35 hover:bg-transparent",
                      )}
                    >
                      {format(date, "d")}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-border/80 pt-2.5">
                {clearable ? (
                  <button
                    type="button"
                    className="rounded-lg px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-background hover:text-foreground"
                    onClick={() => {
                      onChange("");
                      setOpen(false);
                    }}
                  >
                    Clear
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  className="rounded-lg px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary-soft"
                  disabled={Boolean((min && today < min) || (max && today > max))}
                  onClick={() => {
                    onChange(today);
                    setViewMonth(parseLocalDate(today));
                    setOpen(false);
                  }}
                >
                  Today
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
