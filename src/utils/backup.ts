import { exportPayloadSchema } from "@/features/habits/schemas/habit.schema";
import { normalizeTaskTimes } from "@/lib/tasks";
import type { AppSettings, CheckIn, ExportPayload, Habit, Task } from "@/types";

export function buildExportPayload(
  habits: Habit[],
  checkIns: CheckIn[],
  settings: AppSettings,
  tasks: Task[] = [],
): ExportPayload {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    habits,
    checkIns,
    tasks,
    settings,
  };
}

export function serializeExport(payload: ExportPayload): string {
  return `${JSON.stringify(payload, null, 2)}\n`;
}

export function parseImportPayload(raw: string): ExportPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("That file is not valid JSON.");
  }
  const result = exportPayloadSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error("That backup file is missing required Routina data.");
  }
  const payload = result.data;
  const habitIds = new Set(payload.habits.map((habit) => habit.id));
  const orphan = payload.checkIns.find((checkIn) => !habitIds.has(checkIn.habitId));
  if (orphan) {
    throw new Error("The backup contains check-ins for missing habits.");
  }
  return {
    ...payload,
    tasks: (payload.tasks ?? []).map(
      (task) => normalizeTaskTimes(task) as Task,
    ),
  };
}

export function downloadJson(filename: string, contents: string): void {
  const blob = new Blob([contents], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function backupFilename(today: string): string {
  return `routina-backup-${today}.json`;
}
