"use client";

import { getDb } from "@/db/database";
import { normalizeLocale, readStoredLocale } from "@/i18n";
import { normalizeTaskTimes } from "@/lib/tasks";
import type { AppSettings, CheckIn, ExportPayload, Habit, Task } from "@/types";

type MaybeOwned<T> = T & { userId?: string };

function isUnscoped<T extends { userId?: string }>(row: T): boolean {
  return !row.userId;
}

export async function readLegacyLocalPayload(): Promise<ExportPayload | null> {
  try {
    if (typeof window === "undefined") return null;
    const db = getDb();
    const [habits, checkIns, tasks, settingsRow] = await Promise.all([
      db.habits.toArray(),
      db.checkIns.toArray(),
      db.tasks.toArray().catch(() => [] as MaybeOwned<Task>[]),
      db.settings.get("default"),
    ]);

    const legacyHabits = (habits as MaybeOwned<Habit>[]).filter(isUnscoped);
    const legacyCheckIns = (checkIns as MaybeOwned<CheckIn>[]).filter(isUnscoped);
    const legacyTasks = (tasks as MaybeOwned<Task>[]).filter(isUnscoped);

    if (
      legacyHabits.length === 0 &&
      legacyCheckIns.length === 0 &&
      legacyTasks.length === 0
    ) {
      return null;
    }

    const now = new Date().toISOString();
    const settings: AppSettings = settingsRow
      ? {
          id: "default",
          theme: settingsRow.theme,
          weekStartsOn: settingsRow.weekStartsOn,
          browserNotifications: settingsRow.browserNotifications ?? false,
          locale: normalizeLocale(
            (settingsRow as AppSettings).locale ?? readStoredLocale(),
          ),
          createdAt: settingsRow.createdAt,
          updatedAt: settingsRow.updatedAt,
        }
      : {
          id: "default",
          theme: "system",
          weekStartsOn: 1,
          browserNotifications: false,
          locale: readStoredLocale(),
          createdAt: now,
          updatedAt: now,
        };

    return {
      version: 1,
      exportedAt: now,
      habits: legacyHabits.map(({ userId: _userId, ...habit }) => habit as Habit),
      checkIns: legacyCheckIns.map(
        ({ userId: _userId, ...checkIn }) => checkIn as CheckIn,
      ),
      tasks: legacyTasks.map((task) => {
        const { userId: _userId, ...rest } = task;
        return normalizeTaskTimes(rest) as Task;
      }),
      settings,
    };
  } catch {
    return null;
  }
}

export async function clearLegacyLocalData(): Promise<void> {
  try {
    const db = getDb();
    const [habits, checkIns, tasks] = await Promise.all([
      db.habits.toArray(),
      db.checkIns.toArray(),
      db.tasks.toArray().catch(() => [] as MaybeOwned<Task>[]),
    ]);

    const habitIds = (habits as MaybeOwned<Habit>[])
      .filter(isUnscoped)
      .map((habit) => habit.id);
    const checkInIds = (checkIns as MaybeOwned<CheckIn>[])
      .filter(isUnscoped)
      .map((checkIn) => checkIn.id);
    const taskIds = (tasks as MaybeOwned<Task>[])
      .filter(isUnscoped)
      .map((task) => task.id);

    await Promise.all([
      habitIds.length > 0 ? db.habits.bulkDelete(habitIds) : Promise.resolve(),
      checkInIds.length > 0
        ? db.checkIns.bulkDelete(checkInIds)
        : Promise.resolve(),
      taskIds.length > 0 ? db.tasks.bulkDelete(taskIds) : Promise.resolve(),
      db.settings.delete("default").catch(() => undefined),
    ]);
  } catch {
    // ignore
  }
}
