import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  parse,
  startOfMonth,
  startOfWeek,
  subDays,
} from "date-fns";
import type { WeekStartsOn, Weekday } from "@/types";

export const DATE_FORMAT = "yyyy-MM-dd";

export function toLocalDateString(date: Date): string {
  return format(date, DATE_FORMAT);
}

export function parseLocalDate(dateString: string): Date {
  return parse(dateString, DATE_FORMAT, new Date(2000, 0, 1));
}

export function todayString(now: Date = new Date()): string {
  return toLocalDateString(now);
}

export function getWeekday(date: Date | string): Weekday {
  const value = typeof date === "string" ? parseLocalDate(date) : date;
  return getDay(value) as Weekday;
}

export function addDaysToDateString(dateString: string, amount: number): string {
  return toLocalDateString(addDays(parseLocalDate(dateString), amount));
}

export function startOfCalendarWeek(
  dateString: string,
  weekStartsOn: WeekStartsOn,
): string {
  return toLocalDateString(
    startOfWeek(parseLocalDate(dateString), { weekStartsOn }),
  );
}

export function endOfCalendarWeek(
  dateString: string,
  weekStartsOn: WeekStartsOn,
): string {
  return toLocalDateString(
    endOfWeek(parseLocalDate(dateString), { weekStartsOn }),
  );
}

export function eachLocalDay(from: string, to: string): string[] {
  if (from > to) return [];
  return eachDayOfInterval({
    start: parseLocalDate(from),
    end: parseLocalDate(to),
  }).map((date) => toLocalDateString(date));
}

export function minDateString(a: string, b: string): string {
  return a < b ? a : b;
}

export function maxDateString(a: string, b: string): string {
  return a > b ? a : b;
}

export function startOfMonthString(dateString: string): string {
  return toLocalDateString(startOfMonth(parseLocalDate(dateString)));
}

export function endOfMonthString(dateString: string): string {
  return toLocalDateString(endOfMonth(parseLocalDate(dateString)));
}

export function addMonthsToDateString(dateString: string, amount: number): string {
  return toLocalDateString(addMonths(parseLocalDate(dateString), amount));
}

export function formatDisplayDate(dateString: string, pattern = "EEEE, MMMM d"): string {
  return format(parseLocalDate(dateString), pattern);
}

export function formatShortDate(dateString: string): string {
  return format(parseLocalDate(dateString), "MMM d");
}

export function daysAgoString(days: number, today: string): string {
  return toLocalDateString(subDays(parseLocalDate(today), days));
}

export function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function weekdayOrder(weekStartsOn: WeekStartsOn): Weekday[] {
  const days: Weekday[] = [0, 1, 2, 3, 4, 5, 6];
  const startIndex = days.indexOf(weekStartsOn as Weekday);
  return [...days.slice(startIndex), ...days.slice(0, startIndex)];
}
