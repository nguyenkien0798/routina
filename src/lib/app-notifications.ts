import { getScheduledHabits } from "@/lib/frequency";
import {
  describeTaskDue,
  formatTaskTime,
  getTaskTimedAlerts,
  isTaskOverdue,
} from "@/lib/tasks";
import type { CheckIn, Habit, Task } from "@/types";

export type AppNotificationKind =
  | "habit_pending"
  | "task_overdue"
  | "task_due_today"
  | "task_due_soon"
  | "task_checkpoint"
  | "task_starting";

export interface AppNotification {
  id: string;
  kind: AppNotificationKind;
  title: string;
  body: string;
  href: string;
  createdAt: string;
  priority: number;
}

export function buildAppNotifications(
  habits: Habit[],
  checkIns: CheckIn[],
  tasks: Task[],
  today: string,
  now: Date = new Date(),
): AppNotification[] {
  const items: AppNotification[] = [];
  const timed = getTaskTimedAlerts(tasks, now);

  for (const alert of timed) {
    const kind =
      alert.kind === "starting_soon"
        ? "task_starting"
        : alert.kind === "due_checkpoint"
          ? "task_checkpoint"
          : "task_due_soon";
    items.push({
      id: alert.id,
      kind,
      title: alert.title,
      body: alert.body,
      href: "/tasks",
      createdAt: alert.task.updatedAt,
      priority:
        alert.kind === "due_now"
          ? 0
          : alert.kind === "due_checkpoint"
            ? alert.progress === 0.8
              ? 1
              : alert.progress === 0.5
                ? 2
                : 3
            : 1,
    });
  }

  const scheduled = getScheduledHabits(habits, today);
  for (const habit of scheduled) {
    const done = checkIns.some(
      (item) =>
        item.habitId === habit.id && item.date === today && item.completed,
    );
    if (done) continue;
    items.push({
      id: `habit:${habit.id}:${today}`,
      kind: "habit_pending",
      title: habit.name,
      body: "Habit still open for today",
      href: "/",
      createdAt: habit.updatedAt,
      priority: 3,
    });
  }

  const timedTaskIds = new Set(timed.map((alert) => alert.task.id));

  for (const task of tasks) {
    if (task.status !== "open") continue;
    if (task.startDate > today) continue;
    if (timedTaskIds.has(task.id)) continue;

    if (isTaskOverdue(task, now)) {
      items.push({
        id: `task-overdue:${task.id}`,
        kind: "task_overdue",
        title: task.title,
        body: describeTaskDue(task, today, now),
        href: "/tasks",
        createdAt: task.updatedAt,
        priority: 0,
      });
      continue;
    }

    if (task.dueDate === today) {
      items.push({
        id: `task-due:${task.id}`,
        kind: "task_due_today",
        title: task.title,
        body: `Due today · ${formatTaskTime(task.dueTime)}`,
        href: "/tasks",
        createdAt: task.updatedAt,
        priority: 2,
      });
    }
  }

  return items.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function summarizeNotifications(items: AppNotification[]): string {
  const habits = items.filter((item) => item.kind === "habit_pending").length;
  const overdue = items.filter((item) => item.kind === "task_overdue").length;
  const dueSoon = items.filter(
    (item) =>
      item.kind === "task_due_soon" ||
      item.kind === "task_checkpoint" ||
      item.kind === "task_starting",
  ).length;
  const due = items.filter((item) => item.kind === "task_due_today").length;
  const parts: string[] = [];
  if (dueSoon > 0) {
    parts.push(`${dueSoon} coming up soon`);
  }
  if (overdue > 0) {
    parts.push(`${overdue} overdue ${overdue === 1 ? "task" : "tasks"}`);
  }
  if (due > 0) {
    parts.push(`${due} due today`);
  }
  if (habits > 0) {
    parts.push(`${habits} open ${habits === 1 ? "habit" : "habits"}`);
  }
  if (parts.length === 0) return "You are all caught up.";
  if (parts.length === 1) return `You have ${parts[0]}.`;
  if (parts.length === 2) return `You have ${parts[0]} and ${parts[1]}.`;
  return `You have ${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}.`;
}
