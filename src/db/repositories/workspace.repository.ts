import { checkInRepository } from "@/db/repositories/checkin.repository";
import { habitRepository } from "@/db/repositories/habit.repository";
import { settingsRepository } from "@/db/repositories/settings.repository";
import { taskRepository } from "@/db/repositories/task.repository";
import { requireCurrentUserId } from "@/db/session";
import { createId } from "@/lib/id";
import { todayString } from "@/lib/dates";
import {
  buildDemoCheckIns,
  DEMO_HABITS,
  demoStartDate,
} from "@/db/seed";
import type {
  AppSettings,
  CheckIn,
  ExportPayload,
  Habit,
  Task,
} from "@/types";

export type WorkspaceBundle = {
  habits: Habit[];
  checkIns: CheckIn[];
  tasks: Task[];
  settings: AppSettings;
};

export const workspaceRepository = {
  async load(userId?: string): Promise<WorkspaceBundle> {
    const uid = userId ?? (await requireCurrentUserId());
    const [habits, checkIns, tasks, settings] = await Promise.all([
      habitRepository.list(uid),
      checkInRepository.list(uid),
      taskRepository.list(uid),
      settingsRepository.get(uid),
    ]);
    return { habits, checkIns, tasks, settings };
  },

  async replace(
    userId: string,
    payload: Pick<ExportPayload, "habits" | "checkIns" | "tasks" | "settings">,
  ): Promise<WorkspaceBundle> {
    await Promise.all([
      habitRepository.replaceForUser(userId, payload.habits),
      checkInRepository.replaceForUser(userId, payload.checkIns),
      taskRepository.replaceForUser(userId, payload.tasks),
      settingsRepository.replace(userId, payload.settings),
    ]);
    return this.load(userId);
  },

  async clear(userId?: string): Promise<WorkspaceBundle> {
    const uid = userId ?? (await requireCurrentUserId());
    await Promise.all([
      habitRepository.clearForUser(uid),
      checkInRepository.clearForUser(uid),
      taskRepository.clearForUser(uid),
    ]);
    const settings = await settingsRepository.reset();
    return {
      habits: [],
      checkIns: [],
      tasks: [],
      settings,
    };
  },

  async seedDemo(userId?: string): Promise<WorkspaceBundle> {
    const uid = userId ?? (await requireCurrentUserId());
    const existing = await habitRepository.list(uid);
    if (existing.length > 0) {
      throw new Error("Demo data is only available on an empty workspace.");
    }

    const today = todayString();
    const startDate = demoStartDate(today);
    const habits: Habit[] = [];
    const checkIns: CheckIn[] = [];

    for (const demo of DEMO_HABITS) {
      const habit = await habitRepository.create(
        {
          name: demo.name,
          description: demo.description,
          icon: demo.icon,
          color: demo.color,
          category: demo.category,
          frequency: demo.frequency,
          startDate,
          target: demo.target,
        },
        habits.length,
      );
      habits.push(habit);
      for (const row of buildDemoCheckIns(habit.id, demo, today)) {
        checkIns.push({
          id: createId(),
          ...row,
        });
      }
    }

    await checkInRepository.replaceForUser(uid, checkIns);
    return this.load(uid);
  },
};
