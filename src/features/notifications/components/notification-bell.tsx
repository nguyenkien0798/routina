"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Bell, CheckCheck, Clock3, ListChecks, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { todayString } from "@/lib/dates";
import {
  buildAppNotifications,
  type AppNotification,
} from "@/lib/app-notifications";
import { useI18n } from "@/i18n/use-i18n";
import { useHabitStore } from "@/stores/habit.store";
import { useNotificationStore } from "@/stores/notification.store";
import { useTaskStore } from "@/stores/task.store";

interface PanelPosition {
  top: number;
  left: number;
  width: number;
}

const PANEL_WIDTH = 360;
const PANEL_MARGIN = 12;

export function NotificationBell({ className }: { className?: string }) {
  const { t } = useI18n();
  const habits = useHabitStore((state) => state.habits);
  const checkIns = useHabitStore((state) => state.checkIns);
  const tasks = useTaskStore((state) => state.tasks);
  const hydrate = useNotificationStore((state) => state.hydrate);
  const hydrated = useNotificationStore((state) => state.hydrated);
  const readIds = useNotificationStore((state) => state.readIds);
  const markAllRead = useNotificationStore((state) => state.markAllRead);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<PanelPosition | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const today = todayString();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;

    const update = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(PANEL_WIDTH, window.innerWidth - PANEL_MARGIN * 2);
      const rawLeft = rect.right - width;
      const left = Math.min(
        Math.max(PANEL_MARGIN, rawLeft),
        window.innerWidth - width - PANEL_MARGIN,
      );
      setPosition({
        top: rect.bottom + 8,
        left,
        width,
      });
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
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) {
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

  const items = useMemo(
    () => buildAppNotifications(habits, checkIns, tasks, today, new Date(nowTick)),
    [habits, checkIns, tasks, today, nowTick],
  );

  const unread = useMemo(() => {
    if (!hydrated) return items;
    return items.filter((item) => !readIds.has(item.id));
  }, [hydrated, items, readIds]);

  function openPanel() {
    const next = !open;
    setOpen(next);
    if (next && items.length > 0) {
      markAllRead(items.map((item) => item.id));
    }
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <Button
        ref={buttonRef}
        type="button"
        variant="ghost"
        size="icon"
        aria-label={
          unread.length > 0
            ? t("notifications.count", { count: unread.length })
            : t("notifications.label")
        }
        aria-expanded={open}
        onClick={openPanel}
        className="relative"
      >
        <Bell className="h-4 w-4" strokeWidth={1.9} />
        {unread.length > 0 ? (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        ) : null}
      </Button>

      {open && position && typeof document !== "undefined"
        ? createPortal(
            <>
              <button
                type="button"
                aria-label={t("notifications.close")}
                className="fixed inset-0 z-[70] bg-transparent md:bg-[var(--overlay)]/20"
                onClick={() => setOpen(false)}
              />
              <div
                ref={panelRef}
                role="dialog"
                aria-label={t("notifications.label")}
                style={{
                  position: "fixed",
                  top: position.top,
                  left: position.left,
                  width: position.width,
                }}
                className="z-[80] max-h-[min(420px,calc(100dvh-5rem))] overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-[var(--shadow-lg)] animate-dialog-in"
              >
                <div className="flex items-center justify-between gap-3 border-b border-border/80 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold tracking-[-0.015em]">
                      {t("notifications.title")}
                    </p>
                    <p className="truncate text-[11px] text-muted">
                      {t("notifications.subtitle")}
                    </p>
                  </div>
                  {items.length > 0 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      onClick={() => markAllRead(items.map((item) => item.id))}
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      {t("common.read")}
                    </Button>
                  ) : null}
                </div>

                {items.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <p className="text-sm font-medium">{t("common.allClear")}</p>
                    <p className="mt-1 text-[12px] text-muted">{t("notifications.empty")}</p>
                  </div>
                ) : (
                  <ul className="max-h-[min(340px,calc(100dvh-9rem))] overflow-y-auto py-1">
                    {items.map((item) => (
                      <NotificationItem
                        key={item.id}
                        item={item}
                        unread={hydrated ? !readIds.has(item.id) : true}
                        onSelect={() => setOpen(false)}
                      />
                    ))}
                  </ul>
                )}
              </div>
            </>,
            document.body,
          )
        : null}
    </div>
  );
}

function NotificationItem({
  item,
  unread,
  onSelect,
}: {
  item: AppNotification;
  unread: boolean;
  onSelect: () => void;
}) {
  const Icon =
    item.kind === "habit_pending"
      ? ListChecks
      : item.kind === "task_due_soon" ||
          item.kind === "task_checkpoint" ||
          item.kind === "task_starting"
        ? Clock3
        : ListTodo;
  return (
    <li>
      <Link
        href={item.href}
        onClick={onSelect}
        className={cn(
          "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-background/80",
          unread && "bg-primary-soft/40",
        )}
      >
        <span
          className={cn(
            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]",
            item.kind === "task_overdue"
              ? "bg-danger/10 text-danger"
              : item.kind === "habit_pending"
                ? "bg-primary-soft text-primary"
                : item.kind === "task_checkpoint"
                  ? "bg-primary-soft text-primary"
                  : item.kind === "task_due_soon" || item.kind === "task_starting"
                    ? "bg-warning/10 text-warning"
                    : "bg-warning/10 text-warning",
          )}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={1.9} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium tracking-[-0.01em]">
            {item.title}
          </span>
          <span className="mt-0.5 block text-[12px] text-muted">{item.body}</span>
        </span>
        {unread ? (
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
        ) : null}
      </Link>
    </li>
  );
}
