import { getScheduledHabits } from "@/lib/frequency";
import {
  addDaysToDateString,
  eachLocalDay,
  getWeekday,
  startOfCalendarWeek,
} from "@/lib/dates";
import type { CheckIn, Habit, WeekStartsOn } from "@/types";

export interface HeatmapCell {
  date: string;
  weekday: number;
  scheduled: number;
  completed: number;
  level: 0 | 1 | 2 | 3 | 4;
  missed: boolean;
}

export interface HeatmapWeek {
  weekStart: string;
  days: Array<HeatmapCell | null>;
}

export interface HeatmapData {
  year: number;
  weeks: HeatmapWeek[];
  cells: HeatmapCell[];
  totals: {
    completed: number;
    scheduled: number;
    activeDays: number;
  };
  monthly: Array<{ month: number; completed: number; scheduled: number; rate: number }>;
}

export function intensityLevel(
  completed: number,
  scheduled: number,
): 0 | 1 | 2 | 3 | 4 {
  if (scheduled === 0 || completed === 0) return 0;
  const ratio = completed / scheduled;
  if (ratio >= 1) return 4;
  if (ratio >= 0.75) return 3;
  if (ratio >= 0.5) return 2;
  return 1;
}

export function generateHeatmapData(
  habits: Habit[],
  checkIns: CheckIn[],
  year: number,
  today: string,
  weekStartsOn: WeekStartsOn,
  habitId?: string,
): HeatmapData {
  const scopedHabits = habitId
    ? habits.filter((habit) => habit.id === habitId)
    : habits.filter((habit) => !habit.archived);

  const start = `${year}-01-01`;
  const end = `${year}-12-31`;
  const completedByDate = new Map<string, number>();
  const habitIds = new Set(scopedHabits.map((habit) => habit.id));

  for (const checkIn of checkIns) {
    if (!checkIn.completed) continue;
    if (!habitIds.has(checkIn.habitId)) continue;
    completedByDate.set(
      checkIn.date,
      (completedByDate.get(checkIn.date) ?? 0) + 1,
    );
  }

  const cells: HeatmapCell[] = [];
  const monthly = Array.from({ length: 12 }, (_, month) => ({
    month,
    completed: 0,
    scheduled: 0,
    rate: 0,
  }));

  let totalCompleted = 0;
  let totalScheduled = 0;
  let activeDays = 0;

  for (const date of eachLocalDay(start, end)) {
    const scheduledHabits = getScheduledHabits(scopedHabits, date, {
      includeArchived: Boolean(habitId),
    });
    const scheduled = scheduledHabits.length;
    const completed = Math.min(completedByDate.get(date) ?? 0, scheduled);
    const missed = scheduled > 0 && completed === 0 && date < today;
    const cell: HeatmapCell = {
      date,
      weekday: getWeekday(date),
      scheduled,
      completed,
      level: intensityLevel(completed, scheduled),
      missed,
    };
    cells.push(cell);

    const monthIndex = Number(date.slice(5, 7)) - 1;
    monthly[monthIndex].scheduled += scheduled;
    monthly[monthIndex].completed += completed;
    totalScheduled += scheduled;
    totalCompleted += completed;
    if (scheduled > 0) activeDays += 1;
  }

  for (const item of monthly) {
    item.rate =
      item.scheduled === 0 ? 0 : Math.round((item.completed / item.scheduled) * 100);
  }

  const firstWeekStart = startOfCalendarWeek(start, weekStartsOn);
  const weeks: HeatmapWeek[] = [];
  const cellMap = new Map(cells.map((cell) => [cell.date, cell]));
  let cursor = firstWeekStart;
  const lastDate = end;

  while (cursor <= lastDate) {
    const days: Array<HeatmapCell | null> = [];
    for (let offset = 0; offset < 7; offset += 1) {
      const date = addDaysToDateString(cursor, offset);
      const inYear = date.startsWith(String(year));
      days.push(inYear ? (cellMap.get(date) ?? null) : null);
    }
    weeks.push({ weekStart: cursor, days });
    cursor = addDaysToDateString(cursor, 7);
  }

  return {
    year,
    weeks,
    cells,
    totals: {
      completed: totalCompleted,
      scheduled: totalScheduled,
      activeDays,
    },
    monthly,
  };
}
