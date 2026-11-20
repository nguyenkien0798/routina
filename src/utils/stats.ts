import { describeFrequency, getScheduledHabits, isHabitScheduledOnDate } from "@/lib/frequency";
import {
  addDaysToDateString,
  eachLocalDay,
  endOfCalendarWeek,
  endOfMonthString,
  getWeekday,
  maxDateString,
  minDateString,
  startOfCalendarWeek,
  startOfMonthString,
} from "@/lib/dates";
import type { CheckIn, Habit, WeekStartsOn, Weekday } from "@/types";

export interface DailyProgress {
  completed: number;
  total: number;
  percentage: number;
}

export interface RangeStats {
  scheduled: number;
  completed: number;
  percentage: number;
}

export interface HabitStatistics {
  habitId: string;
  name: string;
  color: string;
  icon: string;
  frequencyLabel: string;
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  scheduled: number;
  completed: number;
  completionRate: number;
}

export interface PeriodPoint {
  key: string;
  label: string;
  completed: number;
  total: number;
  percentage: number;
}

function completedSet(checkIns: CheckIn[], habitId?: string): Set<string> {
  const set = new Set<string>();
  for (const checkIn of checkIns) {
    if (!checkIn.completed) continue;
    if (habitId && checkIn.habitId !== habitId) continue;
    set.add(`${checkIn.habitId}:${checkIn.date}`);
  }
  return set;
}

function isChecked(
  set: Set<string>,
  habitId: string,
  dateString: string,
): boolean {
  return set.has(`${habitId}:${dateString}`);
}

export function getHabitCheckIns(checkIns: CheckIn[], habitId: string): CheckIn[] {
  return checkIns.filter(
    (checkIn) => checkIn.habitId === habitId && checkIn.completed,
  );
}

export function calculateDailyProgress(
  habits: Habit[],
  checkIns: CheckIn[],
  dateString: string,
): DailyProgress {
  const scheduled = getScheduledHabits(habits, dateString);
  const total = scheduled.length;
  if (total === 0) {
    return { completed: 0, total: 0, percentage: 0 };
  }
  const set = completedSet(checkIns);
  const completed = scheduled.filter((habit) =>
    isChecked(set, habit.id, dateString),
  ).length;
  return {
    completed,
    total,
    percentage: Math.round((completed / total) * 100),
  };
}

function dayFullyComplete(
  habits: Habit[],
  set: Set<string>,
  dateString: string,
): boolean | null {
  const scheduled = getScheduledHabits(habits, dateString);
  if (scheduled.length === 0) return null;
  return scheduled.every((habit) => isChecked(set, habit.id, dateString));
}

function earliestStart(habits: Habit[], fallback: string): string {
  return habits.reduce(
    (min, habit) => (habit.startDate < min ? habit.startDate : min),
    fallback,
  );
}

export function calculateCurrentStreak(
  habits: Habit[],
  checkIns: CheckIn[],
  today: string,
): number {
  const active = habits.filter((habit) => !habit.archived);
  if (active.length === 0) return 0;

  const set = completedSet(checkIns);
  const minStart = earliestStart(active, today);
  let streak = 0;
  let cursor = today;
  let isToday = true;

  while (cursor >= minStart) {
    const result = dayFullyComplete(active, set, cursor);
    if (result === null) {
      cursor = addDaysToDateString(cursor, -1);
      isToday = false;
      continue;
    }
    if (result) {
      streak += 1;
      cursor = addDaysToDateString(cursor, -1);
      isToday = false;
      continue;
    }
    if (isToday) {
      cursor = addDaysToDateString(cursor, -1);
      isToday = false;
      continue;
    }
    break;
  }

  return streak;
}

export function calculateLongestStreak(
  habits: Habit[],
  checkIns: CheckIn[],
  today: string,
): number {
  const active = habits.filter((habit) => !habit.archived);
  if (active.length === 0) return 0;

  const set = completedSet(checkIns);
  const minStart = earliestStart(active, today);
  let longest = 0;
  let current = 0;

  for (const date of eachLocalDay(minStart, today)) {
    const result = dayFullyComplete(active, set, date);
    if (result === null) continue;
    if (result) {
      current += 1;
      longest = Math.max(longest, current);
    } else if (date !== today) {
      current = 0;
    }
  }

  return longest;
}

function countWeeklyTargetInWeek(
  habit: Habit,
  set: Set<string>,
  weekStart: string,
  weekStartsOn: WeekStartsOn,
  today: string,
): { count: number; target: number; ended: boolean } {
  const frequency = habit.frequency;
  const target =
    frequency.type === "weekly_target" ? frequency.timesPerWeek : 0;
  const weekEnd = endOfCalendarWeek(weekStart, weekStartsOn);
  const from = maxDateString(weekStart, habit.startDate);
  const to = minDateString(weekEnd, today);
  let count = 0;
  if (from <= to) {
    for (const date of eachLocalDay(from, to)) {
      if (isChecked(set, habit.id, date)) count += 1;
    }
  }
  return { count, target, ended: weekEnd <= today };
}

export function calculateHabitCurrentStreak(
  habit: Habit,
  checkIns: CheckIn[],
  today: string,
  weekStartsOn: WeekStartsOn,
): number {
  const set = completedSet(checkIns, habit.id);

  if (habit.frequency.type === "weekly_target") {
    let streak = 0;
    let weekStart = startOfCalendarWeek(today, weekStartsOn);
    const firstWeek = startOfCalendarWeek(habit.startDate, weekStartsOn);
    let isCurrentWeek = true;

    while (weekStart >= firstWeek) {
      const { count, target, ended } = countWeeklyTargetInWeek(
        habit,
        set,
        weekStart,
        weekStartsOn,
        today,
      );
      if (count >= target) {
        streak += 1;
      } else if (isCurrentWeek && !ended) {
        // Current week is still in progress.
      } else {
        break;
      }
      weekStart = addDaysToDateString(weekStart, -7);
      isCurrentWeek = false;
    }
    return streak;
  }

  let streak = 0;
  let cursor = today;
  let isToday = true;

  while (cursor >= habit.startDate) {
    if (!isHabitScheduledOnDate(habit, cursor)) {
      cursor = addDaysToDateString(cursor, -1);
      isToday = false;
      continue;
    }
    if (isChecked(set, habit.id, cursor)) {
      streak += 1;
    } else if (!isToday) {
      break;
    }
    cursor = addDaysToDateString(cursor, -1);
    isToday = false;
  }

  return streak;
}

export function calculateHabitLongestStreak(
  habit: Habit,
  checkIns: CheckIn[],
  today: string,
  weekStartsOn: WeekStartsOn,
): number {
  const set = completedSet(checkIns, habit.id);

  if (habit.frequency.type === "weekly_target") {
    let longest = 0;
    let current = 0;
    let weekStart = startOfCalendarWeek(habit.startDate, weekStartsOn);
    const lastWeek = startOfCalendarWeek(today, weekStartsOn);

    while (weekStart <= lastWeek) {
      const { count, target, ended } = countWeeklyTargetInWeek(
        habit,
        set,
        weekStart,
        weekStartsOn,
        today,
      );
      if (count >= target) {
        current += 1;
        longest = Math.max(longest, current);
      } else if (!(weekStart === lastWeek && !ended)) {
        current = 0;
      }
      weekStart = addDaysToDateString(weekStart, 7);
    }
    return longest;
  }

  let longest = 0;
  let current = 0;
  for (const date of eachLocalDay(habit.startDate, today)) {
    if (!isHabitScheduledOnDate(habit, date)) continue;
    if (isChecked(set, habit.id, date)) {
      current += 1;
      longest = Math.max(longest, current);
    } else if (date !== today) {
      current = 0;
    }
  }
  return longest;
}

function clipRange(from: string, to: string, today: string): [string, string] | null {
  const end = minDateString(to, today);
  if (from > end) return null;
  return [from, end];
}

function habitOpportunities(
  habit: Habit,
  checkIns: CheckIn[],
  from: string,
  to: string,
  today: string,
  weekStartsOn: WeekStartsOn,
): RangeStats {
  const clipped = clipRange(maxDateString(from, habit.startDate), to, today);
  if (!clipped) return { scheduled: 0, completed: 0, percentage: 0 };
  const [start, end] = clipped;
  const set = completedSet(checkIns, habit.id);

  if (habit.frequency.type === "weekly_target") {
    let scheduled = 0;
    let completed = 0;
    let weekStart = startOfCalendarWeek(start, weekStartsOn);
    const lastWeek = startOfCalendarWeek(end, weekStartsOn);
    while (weekStart <= lastWeek) {
      const weekEnd = endOfCalendarWeek(weekStart, weekStartsOn);
      const rangeStart = maxDateString(weekStart, start);
      const rangeEnd = minDateString(weekEnd, end);
      if (rangeStart <= rangeEnd) {
        scheduled += habit.frequency.timesPerWeek;
        let count = 0;
        for (const date of eachLocalDay(weekStart, minDateString(weekEnd, today))) {
          if (date < habit.startDate) continue;
          if (isChecked(set, habit.id, date)) count += 1;
        }
        completed += Math.min(count, habit.frequency.timesPerWeek);
      }
      weekStart = addDaysToDateString(weekStart, 7);
    }
    return {
      scheduled,
      completed,
      percentage: scheduled === 0 ? 0 : Math.round((completed / scheduled) * 100),
    };
  }

  let scheduled = 0;
  let completed = 0;
  for (const date of eachLocalDay(start, end)) {
    if (!isHabitScheduledOnDate(habit, date)) continue;
    scheduled += 1;
    if (isChecked(set, habit.id, date)) completed += 1;
  }
  return {
    scheduled,
    completed,
    percentage: scheduled === 0 ? 0 : Math.round((completed / scheduled) * 100),
  };
}

export function calculateCompletionRate(
  habits: Habit[],
  checkIns: CheckIn[],
  from: string,
  to: string,
  today: string,
  weekStartsOn: WeekStartsOn,
): number {
  const active = habits.filter((habit) => !habit.archived);
  let scheduled = 0;
  let completed = 0;
  for (const habit of active) {
    const stats = habitOpportunities(
      habit,
      checkIns,
      from,
      to,
      today,
      weekStartsOn,
    );
    scheduled += stats.scheduled;
    completed += stats.completed;
  }
  if (scheduled === 0) return 0;
  return Math.round((completed / scheduled) * 100);
}

export function calculateHabitStatistics(
  habit: Habit,
  checkIns: CheckIn[],
  from: string,
  to: string,
  today: string,
  weekStartsOn: WeekStartsOn,
): HabitStatistics {
  const opportunities = habitOpportunities(
    habit,
    checkIns,
    from,
    to,
    today,
    weekStartsOn,
  );
  return {
    habitId: habit.id,
    name: habit.name,
    color: habit.color,
    icon: habit.icon,
    frequencyLabel: describeFrequency(habit.frequency, weekStartsOn),
    currentStreak: calculateHabitCurrentStreak(habit, checkIns, today, weekStartsOn),
    longestStreak: calculateHabitLongestStreak(habit, checkIns, today, weekStartsOn),
    totalCheckIns: getHabitCheckIns(checkIns, habit.id).filter(
      (item) => item.date >= from && item.date <= minDateString(to, today),
    ).length,
    scheduled: opportunities.scheduled,
    completed: opportunities.completed,
    completionRate: opportunities.percentage,
  };
}

export function getWeeklyStatistics(
  habits: Habit[],
  checkIns: CheckIn[],
  from: string,
  to: string,
  today: string,
  weekStartsOn: WeekStartsOn,
): PeriodPoint[] {
  const clipped = clipRange(from, to, today);
  if (!clipped) return [];
  const [start, end] = clipped;
  const points: PeriodPoint[] = [];
  let weekStart = startOfCalendarWeek(start, weekStartsOn);
  const lastWeek = startOfCalendarWeek(end, weekStartsOn);

  while (weekStart <= lastWeek) {
    const weekEnd = minDateString(endOfCalendarWeek(weekStart, weekStartsOn), end);
    const rangeStart = maxDateString(weekStart, start);
    const stats = periodTotals(habits, checkIns, rangeStart, weekEnd, today);
    points.push({
      key: weekStart,
      label: formatWeekLabel(weekStart),
      ...stats,
    });
    weekStart = addDaysToDateString(weekStart, 7);
  }

  return points;
}

export function getMonthlyStatistics(
  habits: Habit[],
  checkIns: CheckIn[],
  from: string,
  to: string,
  today: string,
): PeriodPoint[] {
  const clipped = clipRange(from, to, today);
  if (!clipped) return [];
  const [start, end] = clipped;
  const points: PeriodPoint[] = [];
  let cursor = startOfMonthString(start);

  while (cursor <= end) {
    const monthEnd = minDateString(endOfMonthString(cursor), end);
    const rangeStart = maxDateString(cursor, start);
    const stats = periodTotals(habits, checkIns, rangeStart, monthEnd, today);
    points.push({
      key: cursor,
      label: formatMonthLabel(cursor),
      ...stats,
    });
    const [year, month] = cursor.split("-").map(Number);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    cursor = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
  }

  return points;
}

function periodTotals(
  habits: Habit[],
  checkIns: CheckIn[],
  from: string,
  to: string,
  today: string,
): Omit<PeriodPoint, "key" | "label"> {
  const active = habits.filter((habit) => !habit.archived);
  const set = completedSet(checkIns);
  let total = 0;
  let completed = 0;
  const end = minDateString(to, today);

  for (const date of eachLocalDay(from, end)) {
    const scheduled = getScheduledHabits(active, date);
    total += scheduled.length;
    completed += scheduled.filter((habit) => isChecked(set, habit.id, date)).length;
  }

  return {
    completed,
    total,
    percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

function formatWeekLabel(weekStart: string): string {
  const [, month, day] = weekStart.split("-");
  return `${Number(month)}/${Number(day)}`;
}

function formatMonthLabel(monthStart: string): string {
  const [year, month] = monthStart.split("-");
  const names = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${names[Number(month) - 1]} ${year.slice(2)}`;
}

export function getBestPerformingHabit(
  habits: Habit[],
  checkIns: CheckIn[],
  from: string,
  to: string,
  today: string,
  weekStartsOn: WeekStartsOn,
): HabitStatistics | null {
  const active = habits.filter((habit) => !habit.archived);
  const ranked = active
    .map((habit) =>
      calculateHabitStatistics(habit, checkIns, from, to, today, weekStartsOn),
    )
    .filter((item) => item.scheduled > 0)
    .sort((a, b) => b.completionRate - a.completionRate || b.completed - a.completed);
  return ranked[0] ?? null;
}

export function getMostConsistentWeekday(
  habits: Habit[],
  checkIns: CheckIn[],
  from: string,
  to: string,
  today: string,
): { weekday: Weekday; rate: number; completed: number; scheduled: number } | null {
  const active = habits.filter((habit) => !habit.archived);
  const clipped = clipRange(from, to, today);
  if (!clipped) return null;
  const [start, end] = clipped;
  const set = completedSet(checkIns);
  const buckets = new Map<Weekday, { completed: number; scheduled: number }>();

  for (let day = 0; day <= 6; day += 1) {
    buckets.set(day as Weekday, { completed: 0, scheduled: 0 });
  }

  for (const date of eachLocalDay(start, end)) {
    const weekday = getWeekday(date);
    const bucket = buckets.get(weekday);
    if (!bucket) continue;
    const scheduled = getScheduledHabits(active, date);
    bucket.scheduled += scheduled.length;
    bucket.completed += scheduled.filter((habit) =>
      isChecked(set, habit.id, date),
    ).length;
  }

  let best: { weekday: Weekday; rate: number; completed: number; scheduled: number } | null =
    null;
  for (const [weekday, bucket] of buckets) {
    if (bucket.scheduled === 0) continue;
    const rate = bucket.completed / bucket.scheduled;
    if (!best || rate > best.rate) {
      best = { weekday, rate, completed: bucket.completed, scheduled: bucket.scheduled };
    }
  }
  return best;
}

export function countTotalCheckIns(
  checkIns: CheckIn[],
  from: string,
  to: string,
  today: string,
  habitIds?: Set<string>,
): number {
  const end = minDateString(to, today);
  return checkIns.filter((checkIn) => {
    if (!checkIn.completed) return false;
    if (checkIn.date < from || checkIn.date > end) return false;
    if (habitIds && !habitIds.has(checkIn.habitId)) return false;
    return true;
  }).length;
}
