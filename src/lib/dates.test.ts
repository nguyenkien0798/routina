import { describe, expect, it } from "vitest";
import {
  addDaysToDateString,
  parseLocalDate,
  startOfCalendarWeek,
  toLocalDateString,
} from "@/lib/dates";

describe("local date helpers", () => {
  it("formats local calendar dates without UTC shifting", () => {
    const date = new Date(2026, 0, 1, 0, 15, 0);
    expect(toLocalDateString(date)).toBe("2026-01-01");
  });

  it("round-trips YYYY-MM-DD through the local parser", () => {
    expect(toLocalDateString(parseLocalDate("2026-10-30"))).toBe("2026-10-30");
    expect(toLocalDateString(parseLocalDate("2026-01-01"))).toBe("2026-01-01");
  });

  it("adds days across month boundaries using calendar dates", () => {
    expect(addDaysToDateString("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDaysToDateString("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("uses calendar weeks instead of rolling 7-day windows", () => {
    // 2026-01-07 is a Wednesday. With Monday as week start, the week begins Jan 5.
    expect(startOfCalendarWeek("2026-01-07", 1)).toBe("2026-01-05");
    expect(startOfCalendarWeek("2026-01-04", 1)).toBe("2025-12-29");
  });
});
