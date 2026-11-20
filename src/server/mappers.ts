import type {
  CheckIn as PrismaCheckIn,
  Habit as PrismaHabit,
  Settings as PrismaSettings,
  Task as PrismaTask,
} from "@prisma/client";
import { normalizeLocale } from "@/i18n";
import { normalizeTaskTimes } from "@/lib/tasks";
import type {
  AppSettings,
  CheckIn,
  Frequency,
  Habit,
  HabitTarget,
  Task,
  TaskPriority,
  TaskStatus,
  ThemePreference,
  WeekStartsOn,
} from "@/types";

export function toHabit(row: PrismaHabit): Habit {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    icon: row.icon,
    color: row.color,
    category: row.category,
    frequency: JSON.parse(row.frequency) as Frequency,
    startDate: row.startDate,
    target: row.target ? (JSON.parse(row.target) as HabitTarget) : null,
    archived: row.archived,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function fromHabit(habit: Habit) {
  return {
    id: habit.id,
    name: habit.name,
    description: habit.description,
    icon: habit.icon,
    color: habit.color,
    category: habit.category,
    frequency: JSON.stringify(habit.frequency),
    startDate: habit.startDate,
    target: habit.target ? JSON.stringify(habit.target) : null,
    archived: habit.archived,
    sortOrder: habit.sortOrder,
    createdAt: habit.createdAt,
    updatedAt: habit.updatedAt,
  };
}

export function toCheckIn(row: PrismaCheckIn): CheckIn {
  return {
    id: row.id,
    habitId: row.habitId,
    date: row.date,
    completed: row.completed,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toTask(row: PrismaTask): Task {
  return normalizeTaskTimes({
    id: row.id,
    title: row.title,
    notes: row.notes,
    startDate: row.startDate,
    startTime: row.startTime,
    dueDate: row.dueDate,
    dueTime: row.dueTime,
    status: row.status as TaskStatus,
    priority: row.priority as TaskPriority,
    completedAt: row.completedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }) as Task;
}

export function fromTask(task: Task) {
  const normalized = normalizeTaskTimes(task) as Task;
  return {
    id: normalized.id,
    title: normalized.title,
    notes: normalized.notes,
    startDate: normalized.startDate,
    startTime: normalized.startTime,
    dueDate: normalized.dueDate,
    dueTime: normalized.dueTime,
    status: normalized.status,
    priority: normalized.priority,
    completedAt: normalized.completedAt,
    createdAt: normalized.createdAt,
    updatedAt: normalized.updatedAt,
  };
}

export function toSettings(row: PrismaSettings): AppSettings {
  return {
    id: "default",
    theme: row.theme as ThemePreference,
    weekStartsOn: row.weekStartsOn as WeekStartsOn,
    browserNotifications: row.browserNotifications,
    locale: normalizeLocale(row.locale),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function defaultSettingsRow(userId: string) {
  const now = new Date().toISOString();
  return {
    userId,
    theme: "system",
    weekStartsOn: 1,
    browserNotifications: false,
    locale: "en",
    createdAt: now,
    updatedAt: now,
  };
}
