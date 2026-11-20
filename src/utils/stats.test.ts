import { describe, expect, it } from "vitest";
import type { CheckIn, Habit } from "@/types";
import {
  calculateCompletionRate,
  calculateCurrentStreak,
  calculateDailyProgress,
  calculateHabitCurrentStreak,
  calculateHabitLongestStreak,
  calculateLongestStreak,
} from "@/utils/stats";
import { generateHeatmapData } from "@/utils/heatmap";
import { getScheduledHabits } from "@/lib/frequency";

function habit(partial: Partial<Habit> & Pick<Habit, "id" | "frequency" | "startDate">): Habit {
  return {
    name: partial.name ?? partial.id,
    description: "",
    icon: "sparkles",
    color: "#43865A",
    category: "Lifestyle",
    target: null,
    archived: false,
    sortOrder: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

function check(habitId: string, date: string): CheckIn {
  return {
    id: `${habitId}-${date}`,
    habitId,
    date,
    completed: true,
    createdAt: `${date}T00:00:00.000Z`,
    updatedAt: `${date}T00:00:00.000Z`,
  };
}

const daily = habit({
  id: "read",
  frequency: { type: "daily" },
  startDate: "2026-01-01",
});

describe("daily progress and scheduling", () => {
  it("counts only habits scheduled for the date", () => {
    const weekdayHabit = habit({
      id: "gym",
      frequency: { type: "weekly_days", days: [1, 3, 5] },
      startDate: "2026-01-01",
    });
    // 2026-01-05 is Monday, 2026-01-06 is Tuesday
    expect(getScheduledHabits([daily, weekdayHabit], "2026-01-05").map((item) => item.id)).toEqual([
      "read",
      "gym",
    ]);
    expect(getScheduledHabits([daily, weekdayHabit], "2026-01-06").map((item) => item.id)).toEqual([
      "read",
    ]);
  });

  it("excludes archived habits from today's list", () => {
    const archived = habit({
      id: "old",
      frequency: { type: "daily" },
      startDate: "2026-01-01",
      archived: true,
    });
    expect(getScheduledHabits([daily, archived], "2026-01-05")).toHaveLength(1);
  });

  it("computes daily completion from actual check-ins", () => {
    const progress = calculateDailyProgress(
      [daily],
      [check("read", "2026-01-05")],
      "2026-01-05",
    );
    expect(progress).toEqual({ completed: 1, total: 1, percentage: 100 });
  });
});

describe("streaks", () => {
  it("counts consecutive completed scheduled days", () => {
    const checkIns = ["2026-01-01", "2026-01-02", "2026-01-03", "2026-01-04", "2026-01-05"].map(
      (date) => check("read", date),
    );
    expect(calculateCurrentStreak([daily], checkIns, "2026-01-05")).toBe(5);
    expect(calculateHabitCurrentStreak(daily, checkIns, "2026-01-05", 1)).toBe(5);
  });

  it("does not treat an incomplete today as a broken streak", () => {
    const checkIns = ["2026-01-01", "2026-01-02", "2026-01-03"].map((date) =>
      check("read", date),
    );
    expect(calculateCurrentStreak([daily], checkIns, "2026-01-04")).toBe(3);
  });

  it("breaks when a past scheduled day is missed", () => {
    const checkIns = [check("read", "2026-01-05")];
    expect(calculateCurrentStreak([daily], checkIns, "2026-01-05")).toBe(1);
    expect(calculateCurrentStreak([daily], checkIns, "2026-01-06")).toBe(1);
    expect(calculateCurrentStreak([daily], checkIns, "2026-01-07")).toBe(0);
  });

  it("does not let unscheduled days break a weekday habit streak", () => {
    const gym = habit({
      id: "gym",
      frequency: { type: "weekly_days", days: [1, 3, 5] },
      startDate: "2026-01-05",
    });
    const checkIns = [
      check("gym", "2026-01-05"), // Mon
      check("gym", "2026-01-07"), // Wed
      check("gym", "2026-01-09"), // Fri
    ];
    expect(calculateHabitCurrentStreak(gym, checkIns, "2026-01-11", 1)).toBe(3);
  });

  it("calculates weekly targets with calendar weeks", () => {
    const sleep = habit({
      id: "sleep",
      frequency: { type: "weekly_target", timesPerWeek: 3 },
      startDate: "2026-01-05",
    });
    const weekOne = ["2026-01-05", "2026-01-06", "2026-01-07"].map((date) =>
      check("sleep", date),
    );
    const weekTwo = ["2026-01-12", "2026-01-13", "2026-01-14"].map((date) =>
      check("sleep", date),
    );
    expect(
      calculateHabitCurrentStreak(sleep, [...weekOne, ...weekTwo], "2026-01-14", 1),
    ).toBe(2);
    expect(
      calculateHabitLongestStreak(sleep, [...weekOne, ...weekTwo], "2026-01-14", 1),
    ).toBe(2);
  });

  it("does not count future dates as missed habits", () => {
    const checkIns = ["2026-01-01", "2026-01-02"].map((date) => check("read", date));
    expect(calculateLongestStreak([daily], checkIns, "2026-01-02")).toBe(2);
    expect(calculateCompletionRate([daily], checkIns, "2026-01-01", "2026-01-10", "2026-01-02", 1)).toBe(
      100,
    );
  });
});

describe("heatmap", () => {
  it("does not treat days without scheduled habits as missed", () => {
    const gym = habit({
      id: "gym",
      frequency: { type: "weekly_days", days: [1] },
      startDate: "2026-01-01",
    });
    const data = generateHeatmapData([gym], [], 2026, "2026-01-10", 1);
    const tuesday = data.cells.find((cell) => cell.date === "2026-01-06");
    expect(tuesday?.scheduled).toBe(0);
    expect(tuesday?.missed).toBe(false);
    expect(tuesday?.level).toBe(0);
  });

  it("ignores archived habits in overall activity", () => {
    const archived = habit({
      id: "old",
      frequency: { type: "daily" },
      startDate: "2026-01-01",
      archived: true,
    });
    const data = generateHeatmapData(
      [archived],
      [check("old", "2026-01-05")],
      2026,
      "2026-01-10",
      1,
    );
    const cell = data.cells.find((item) => item.date === "2026-01-05");
    expect(cell?.scheduled).toBe(0);
    expect(cell?.completed).toBe(0);
  });
});
