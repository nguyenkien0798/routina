import type { Task } from "@/types";

export const DEFAULT_START_TIME = "08:30";
export const DEFAULT_DUE_TIME = "17:30";

/**
 * Japanese work 2-5-8 as progress through the task window (start → due):
 * remind at 20%, 50%, and 80% of that duration — scaled to each task.
 */
export const TASK_REMIND_PROGRESS = [0.2, 0.5, 0.8] as const;

/** How long each progress checkpoint stays active so it can be shown once. */
export const TASK_REMIND_WINDOW_MINUTES = 12;

/** Same-day UI copy when due is within this many minutes. */
export const TASK_DUE_SOON_UI_MINUTES = 60;

/** Remind this many minutes before start time. */
export const TASK_START_REMIND_MINUTES = 5;

/** Minimum task span to emit 2-5-8 checkpoints (avoids noise on tiny windows). */
export const TASK_REMIND_MIN_SPAN_MS = 30 * 60_000;

const TIME_RE = /^\d{2}:\d{2}$/;

export function normalizeTaskTime(
  value: string | null | undefined,
  fallback: string,
): string {
  if (value && TIME_RE.test(value)) return value;
  return fallback;
}

export function normalizeTaskTimes<T extends Partial<Task>>(task: T): T & {
  startTime: string;
  dueTime: string;
} {
  return {
    ...task,
    startTime: normalizeTaskTime(task.startTime, DEFAULT_START_TIME),
    dueTime: normalizeTaskTime(task.dueTime, DEFAULT_DUE_TIME),
  };
}

export function taskDateTime(date: string, time: string): Date {
  return new Date(`${date}T${normalizeTaskTime(time, DEFAULT_DUE_TIME)}:00`);
}

export function getTaskStartDateTime(task: Task): Date {
  return taskDateTime(
    task.startDate,
    normalizeTaskTime(task.startTime, DEFAULT_START_TIME),
  );
}

export function getTaskDueDateTime(task: Task): Date {
  return taskDateTime(
    task.dueDate,
    normalizeTaskTime(task.dueTime, DEFAULT_DUE_TIME),
  );
}

export function formatTaskTime(time: string): string {
  const normalized = normalizeTaskTime(time, DEFAULT_DUE_TIME);
  const [hours, minutes] = normalized.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function isTaskVisibleOnDate(task: Task, date: string): boolean {
  if (task.startDate > date) return false;
  if (task.status === "done") {
    if (!task.completedAt) return false;
    return task.completedAt.slice(0, 10) === date;
  }
  return true;
}

export function getTasksForToday(tasks: Task[], today: string): Task[] {
  return tasks.filter((task) => isTaskVisibleOnDate(task, today));
}

export function isTaskOverdue(task: Task, now: Date = new Date()): boolean {
  if (task.status !== "open") return false;
  return getTaskDueDateTime(task).getTime() < now.getTime();
}

export function getTaskSpanMs(task: Task): number {
  return (
    getTaskDueDateTime(task).getTime() - getTaskStartDateTime(task).getTime()
  );
}

export function describeTaskDue(
  task: Task,
  today: string,
  now: Date = new Date(),
): string {
  if (task.status === "done") return "Done";

  const dueAt = getTaskDueDateTime(task);
  const dueMs = dueAt.getTime() - now.getTime();
  const dueTimeLabel = formatTaskTime(task.dueTime);

  if (dueMs < 0) {
    const overdueMins = Math.round(-dueMs / 60_000);
    if (overdueMins < 60) {
      return overdueMins <= 1
        ? "Overdue just now"
        : `Overdue by ${overdueMins} min`;
    }
    if (task.dueDate === today) {
      return `Overdue · was due ${dueTimeLabel}`;
    }
    const days = dateDiffDays(task.dueDate, today);
    return days === 1 ? "Overdue by 1 day" : `Overdue by ${days} days`;
  }

  if (dueMs <= TASK_DUE_SOON_UI_MINUTES * 60_000) {
    const mins = Math.max(1, Math.round(dueMs / 60_000));
    return `Due in ${mins} min · ${dueTimeLabel}`;
  }

  const progress = getTaskProgress(task, now);
  const active = nearestProgressCheckpoint(progress);
  if (active !== null) {
    return `2-5-8 · ${Math.round(active * 100)}% of window · ${dueTimeLabel}`;
  }

  if (task.dueDate === today) return `Due today · ${dueTimeLabel}`;
  const days = dateDiffDays(today, task.dueDate);
  if (days === 1) return `Due tomorrow · ${dueTimeLabel}`;
  return `Due in ${days} days · ${dueTimeLabel}`;
}

export type TaskTimedAlertKind =
  | "starting_soon"
  | "due_checkpoint"
  | "due_now";

export interface TaskTimedAlert {
  id: string;
  kind: TaskTimedAlertKind;
  task: Task;
  title: string;
  body: string;
  /** Progress fraction (0.2 / 0.5 / 0.8) for 2-5-8 checkpoints. */
  progress?: number;
}

export function getTaskTimedAlerts(
  tasks: Task[],
  now: Date = new Date(),
  progressMarks: readonly number[] = TASK_REMIND_PROGRESS,
): TaskTimedAlert[] {
  const startLeadMs = TASK_START_REMIND_MINUTES * 60_000;
  const windowMs = TASK_REMIND_WINDOW_MINUTES * 60_000;
  const alerts: TaskTimedAlert[] = [];

  for (const task of tasks) {
    if (task.status !== "open") continue;
    const start = getTaskStartDateTime(task).getTime();
    const due = getTaskDueDateTime(task).getTime();
    const nowMs = now.getTime();
    const span = due - start;

    if (nowMs >= start - startLeadMs && nowMs <= start + 60_000) {
      const mins = Math.max(0, Math.round((start - nowMs) / 60_000));
      alerts.push({
        id: `task-start:${task.id}`,
        kind: "starting_soon",
        task,
        title: task.title,
        body:
          mins <= 0
            ? `Starting now · ${formatTaskTime(task.startTime)}`
            : `Starts in ${mins} min · ${formatTaskTime(task.startTime)}`,
      });
    }

    if (span >= TASK_REMIND_MIN_SPAN_MS) {
      for (const mark of progressMarks) {
        const target = start + span * mark;
        if (nowMs < target || nowMs >= target + windowMs) continue;
        const pct = Math.round(mark * 100);
        alerts.push({
          id: `task-due-258:${task.id}:${pct}`,
          kind: "due_checkpoint",
          task,
          title: task.title,
          progress: mark,
          body: checkpointBody(mark, task, span),
        });
      }
    }

    if (nowMs >= due && nowMs <= due + 2 * 60_000) {
      alerts.push({
        id: `task-due-now:${task.id}`,
        kind: "due_now",
        task,
        title: task.title,
        body: `Due now · ${formatTaskTime(task.dueTime)}`,
      });
    }
  }

  return alerts;
}

function getTaskProgress(task: Task, now: Date): number | null {
  const start = getTaskStartDateTime(task).getTime();
  const due = getTaskDueDateTime(task).getTime();
  const span = due - start;
  if (span < TASK_REMIND_MIN_SPAN_MS) return null;
  const nowMs = now.getTime();
  if (nowMs < start || nowMs > due) return null;
  return (nowMs - start) / span;
}

function nearestProgressCheckpoint(progress: number | null): number | null {
  if (progress === null) return null;
  const windowRatio = TASK_REMIND_WINDOW_MINUTES / (24 * 60);
  // Prefer absolute time window via progress delta ≈ window / span;
  // for UI label, treat ±1.5% as "on" a mark when span is long.
  for (const mark of TASK_REMIND_PROGRESS) {
    if (Math.abs(progress - mark) <= Math.max(0.015, windowRatio)) {
      return mark;
    }
  }
  return null;
}

function checkpointBody(progress: number, task: Task, spanMs: number): string {
  const pct = Math.round(progress * 100);
  const dueLabel = formatTaskTime(task.dueTime);
  const elapsed = formatDuration(spanMs * progress);
  const remaining = formatDuration(spanMs * (1 - progress));

  if (progress <= 0.25) {
    return `${pct}% checkpoint · ${elapsed} in, ${remaining} left · push the first stretch · due ${dueLabel}`;
  }
  if (progress <= 0.6) {
    return `${pct}% checkpoint · ${elapsed} in, ${remaining} left · mid-window check · due ${dueLabel}`;
  }
  return `${pct}% checkpoint · ${elapsed} in, ${remaining} left · close out · due ${dueLabel}`;
}

function formatDuration(ms: number): string {
  const totalMins = Math.max(1, Math.round(ms / 60_000));
  if (totalMins < 60) return `${totalMins}m`;
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

function dateDiffDays(from: string, to: string): number {
  const a = new Date(`${from}T12:00:00`);
  const b = new Date(`${to}T12:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}
