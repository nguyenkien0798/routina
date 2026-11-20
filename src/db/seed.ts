import { addDaysToDateString, getWeekday, todayString } from "@/lib/dates";
import type { CheckIn, CreateHabitInput } from "@/types";

interface SeedHabit extends CreateHabitInput {
  historyRate: number;
}

export const DEMO_HABITS: SeedHabit[] = [
  {
    name: "Read 20 pages",
    description: "Read at least 20 pages of a book before bed.",
    icon: "book-open",
    color: "#4A90A4",
    category: "Learning",
    frequency: { type: "daily" },
    startDate: "",
    target: { value: 20, unit: "pages" },
    historyRate: 0.82,
  },
  {
    name: "Exercise 30 minutes",
    description: "Move your body with a focused workout.",
    icon: "dumbbell",
    color: "#E07A5F",
    category: "Fitness",
    frequency: { type: "weekly_days", days: [1, 3, 5] },
    startDate: "",
    target: { value: 30, unit: "minutes" },
    historyRate: 0.74,
  },
  {
    name: "Learn English",
    description: "Practice vocabulary, listening, or conversation.",
    icon: "languages",
    color: "#5B7CFA",
    category: "Learning",
    frequency: { type: "daily" },
    startDate: "",
    target: null,
    historyRate: 0.7,
  },
  {
    name: "Drink 2 liters of water",
    description: "Stay hydrated throughout the day.",
    icon: "droplets",
    color: "#3D6B8A",
    category: "Health",
    frequency: { type: "daily" },
    startDate: "",
    target: { value: 2, unit: "liters" },
    historyRate: 0.88,
  },
  {
    name: "Sleep before 11 PM",
    description: "Wind down early enough to rest well.",
    icon: "moon",
    color: "#7C5CBF",
    category: "Lifestyle",
    frequency: { type: "weekly_target", timesPerWeek: 5 },
    startDate: "",
    target: null,
    historyRate: 0.66,
  },
];

function shouldComplete(rate: number, date: string, salt: number): boolean {
  let hash = salt;
  for (let i = 0; i < date.length; i += 1) {
    hash = (hash * 31 + date.charCodeAt(i)) % 1000;
  }
  return hash / 1000 < rate;
}

export function buildDemoCheckIns(
  habitId: string,
  habit: SeedHabit,
  today: string,
  days = 56,
): Omit<CheckIn, "id">[] {
  const startDate = addDaysToDateString(today, -(days - 1));
  const records: Omit<CheckIn, "id">[] = [];

  for (let offset = 0; offset < days; offset += 1) {
    const date = addDaysToDateString(startDate, offset);
    if (date > today) continue;
    if (habit.frequency.type === "weekly_days") {
      if (!habit.frequency.days.includes(getWeekday(date))) continue;
    }
    if (!shouldComplete(habit.historyRate, date, habit.name.length)) continue;
    records.push({
      habitId,
      date,
      completed: true,
      createdAt: `${date}T08:00:00.000Z`,
      updatedAt: `${date}T08:00:00.000Z`,
    });
  }

  return records;
}

export function demoStartDate(today = todayString()): string {
  return addDaysToDateString(today, -55);
}
