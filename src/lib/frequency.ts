import { WEEKDAY_LABELS } from "@/lib/constants";
import { getWeekday } from "@/lib/dates";
import type { Frequency, Habit, WeekStartsOn } from "@/types";

export function isHabitScheduledOnDate(
  habit: Pick<Habit, "frequency" | "startDate">,
  dateString: string,
): boolean {
  if (dateString < habit.startDate) return false;

  switch (habit.frequency.type) {
    case "daily":
      return true;
    case "weekly_days":
      return habit.frequency.days.includes(getWeekday(dateString));
    case "weekly_target":
      return true;
    default:
      return false;
  }
}

export function describeFrequency(
  frequency: Frequency,
  weekStartsOn: WeekStartsOn = 1,
): string {
  switch (frequency.type) {
    case "daily":
      return "Daily";
    case "weekly_days": {
      if (frequency.days.length === 7) return "Daily";
      const ordered = [...frequency.days].sort((a, b) => {
        const order = (day: number) => (day - weekStartsOn + 7) % 7;
        return order(a) - order(b);
      });
      return ordered.map((day) => WEEKDAY_LABELS[day].short).join(", ");
    }
    case "weekly_target":
      return `${frequency.timesPerWeek}× / week`;
    default:
      return "";
  }
}

export function getScheduledHabits<T extends Habit>(
  habits: T[],
  dateString: string,
  options?: { includeArchived?: boolean },
): T[] {
  return habits.filter((habit) => {
    if (!options?.includeArchived && habit.archived) return false;
    return isHabitScheduledOnDate(habit, dateString);
  });
}
