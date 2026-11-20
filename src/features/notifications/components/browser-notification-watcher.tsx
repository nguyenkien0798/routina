"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { todayString } from "@/lib/dates";
import { buildAppNotifications } from "@/lib/app-notifications";
import {
  getBrowserNotificationPermission,
  showBrowserAlert,
  showBrowserDigest,
} from "@/lib/browser-notifications";
import { getTaskTimedAlerts } from "@/lib/tasks";
import { useHabitStore } from "@/stores/habit.store";
import { useNotificationStore } from "@/stores/notification.store";
import { useSettingsStore } from "@/stores/settings.store";
import { useTaskStore } from "@/stores/task.store";

/**
 * Shows OS notifications only while this tab/document is open.
 * No service worker — nothing fires after the app is closed.
 */
export function BrowserNotificationWatcher() {
  const habits = useHabitStore((state) => state.habits);
  const checkIns = useHabitStore((state) => state.checkIns);
  const tasks = useTaskStore((state) => state.tasks);
  const enabled =
    useSettingsStore((state) => state.settings?.browserNotifications) ?? false;
  const hydrate = useNotificationStore((state) => state.hydrate);
  const hydrated = useNotificationStore((state) => state.hydrated);
  const browserShownIds = useNotificationStore((state) => state.browserShownIds);
  const markBrowserShown = useNotificationStore((state) => state.markBrowserShown);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const today = todayString();
  const lastFingerprint = useRef<string>("");

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => setNowTick(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, [enabled]);

  const now = useMemo(() => new Date(nowTick), [nowTick]);

  const items = useMemo(
    () => buildAppNotifications(habits, checkIns, tasks, today, now),
    [habits, checkIns, tasks, today, now],
  );

  // Daily digest for open habits / due tasks (once per item per day).
  useEffect(() => {
    if (!enabled || !hydrated) return;
    if (getBrowserNotificationPermission() !== "granted") return;

    const pending = items.filter(
      (item) =>
        (item.kind === "habit_pending" ||
          item.kind === "task_overdue" ||
          item.kind === "task_due_today") &&
        !browserShownIds.has(item.id),
    );
    if (pending.length === 0) return;

    const fingerprint = pending
      .map((item) => item.id)
      .sort()
      .join("|");
    if (fingerprint === lastFingerprint.current) return;

    const timer = window.setTimeout(() => {
      if (typeof document === "undefined") return;
      showBrowserDigest(pending, pending[0]?.href ?? "/");
      markBrowserShown(pending.map((item) => item.id));
      lastFingerprint.current = fingerprint;
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [enabled, hydrated, items, browserShownIds, markBrowserShown]);

  // Timed alerts near start / due time (while tab is open).
  useEffect(() => {
    if (!enabled || !hydrated) return;
    if (getBrowserNotificationPermission() !== "granted") return;

    const alerts = getTaskTimedAlerts(tasks, now).filter(
      (alert) => !browserShownIds.has(alert.id),
    );
    if (alerts.length === 0) return;

    for (const alert of alerts) {
      showBrowserAlert(alert.title, alert.body, alert.id, "/tasks");
    }
    markBrowserShown(alerts.map((alert) => alert.id));
  }, [enabled, hydrated, tasks, now, browserShownIds, markBrowserShown]);

  return null;
}
