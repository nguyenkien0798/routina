"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HabitGlyph } from "@/components/common/habit-icon";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SelectMenu } from "@/components/ui/select-menu";
import { WEEKDAY_LABELS } from "@/lib/constants";
import { cn } from "@/lib/cn";
import {
  formatDisplayDate,
  todayString,
  weekdayOrder,
} from "@/lib/dates";
import { describeFrequency, getScheduledHabits } from "@/lib/frequency";
import { useI18n } from "@/i18n/use-i18n";
import { useHabitStore } from "@/stores/habit.store";
import { useSettingsStore } from "@/stores/settings.store";
import { generateHeatmapData, type HeatmapCell } from "@/utils/heatmap";

const MONTHS = [
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

export function CalendarView() {
  const { t } = useI18n();
  const habits = useHabitStore((state) => state.habits);
  const checkIns = useHabitStore((state) => state.checkIns);
  const weekStartsOn = useSettingsStore((state) => state.settings?.weekStartsOn ?? 1);
  const today = todayString();
  const [year, setYear] = useState(() => Number(today.slice(0, 4)));
  const [habitId, setHabitId] = useState("all");
  const [selected, setSelected] = useState<string | null>(today);
  const [hovered, setHovered] = useState<HeatmapCell | null>(null);
  const todayCellRef = useRef<HTMLButtonElement>(null);

  const heatmap = useMemo(
    () =>
      generateHeatmapData(
        habits,
        checkIns,
        year,
        today,
        weekStartsOn,
        habitId === "all" ? undefined : habitId,
      ),
    [habits, checkIns, year, today, weekStartsOn, habitId],
  );

  const selectedHabits = useMemo(() => {
    if (!selected) return [];
    const scoped =
      habitId === "all"
        ? habits.filter((habit) => !habit.archived)
        : habits.filter((habit) => habit.id === habitId);
    return getScheduledHabits(scoped, selected, {
      includeArchived: habitId !== "all",
    }).map((habit) => ({
      habit,
      completed: checkIns.some(
        (item) => item.habitId === habit.id && item.date === selected && item.completed,
      ),
    }));
  }, [selected, habits, checkIns, habitId]);

  useEffect(() => {
    todayCellRef.current?.scrollIntoView({
      inline: "center",
      block: "nearest",
    });
  }, [heatmap, year]);

  const days = weekdayOrder(weekStartsOn);
  const monthLabels = useMemo(() => {
    const labels: Array<{ index: number; label: string }> = [];
    let last = -1;
    heatmap.weeks.forEach((week, index) => {
      const first = week.days.find((cell) => cell);
      if (!first) return;
      const month = Number(first.date.slice(5, 7));
      if (month !== last) {
        labels.push({ index, label: MONTHS[month - 1] });
        last = month;
      }
    });
    return labels;
  }, [heatmap.weeks]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("calendar.title")}
        description={t("calendar.description")}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="icon"
              aria-label="Previous year"
              onClick={() => setYear((value) => value - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-14 text-center text-sm font-semibold">{year}</span>
            <Button
              variant="secondary"
              size="icon"
              aria-label="Next year"
              onClick={() => setYear((value) => value + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SelectMenu
          className="w-full sm:max-w-xs"
          value={habitId}
          onChange={setHabitId}
          aria-label="Filter heatmap by habit"
          options={[
            { value: "all", label: "All active habits" },
            ...habits.map((habit) => ({
              value: habit.id,
              label: habit.archived ? `${habit.name} (archived)` : habit.name,
            })),
          ]}
        />
        <p className="text-sm text-muted">
          {heatmap.totals.completed} check-ins across {heatmap.totals.activeDays} active days
        </p>
      </div>

      <Card className="overflow-x-auto p-4">
        <div className="min-w-max">
          <div className="mb-2 flex gap-1">
            <span className="w-7 shrink-0" />
            {heatmap.weeks.map((week, index) => {
              const label = monthLabels.find((item) => item.index === index);
              return (
                <span
                  key={week.weekStart}
                  className="h-4 w-3 text-[10px] leading-4 text-muted"
                >
                  {label?.label ?? ""}
                </span>
              );
            })}
          </div>
          <div className="flex gap-1">
            <div className="flex w-7 shrink-0 flex-col gap-1">
              {days.map((day, index) => (
                <span
                  key={day}
                  className="h-3 text-[10px] leading-3 text-muted"
                >
                  {index % 2 === 1 ? WEEKDAY_LABELS[day].short : ""}
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              {heatmap.weeks.map((week) => (
                <div key={week.weekStart} className="flex flex-col gap-1">
                  {week.days.map((cell, index) =>
                    cell ? (
                      <button
                        key={cell.date}
                        ref={cell.date === today ? todayCellRef : undefined}
                        type="button"
                        title={`${cell.date}: ${cell.completed}/${cell.scheduled} completed`}
                        onMouseEnter={() => setHovered(cell)}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => setSelected(cell.date)}
                        className={cn(
                          "h-3 w-3 rounded-[3px] transition-transform hover:scale-125",
                          selected === cell.date && "ring-2 ring-primary ring-offset-1 ring-offset-surface",
                        )}
                        style={{ backgroundColor: cellColor(cell) }}
                      />
                    ) : (
                      <span key={`${week.weekStart}-${index}`} className="h-3 w-3" />
                    ),
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-muted">
            <span>
              {hovered
                ? `${formatDisplayDate(hovered.date, "MMM d")}: ${
                    hovered.scheduled === 0
                      ? "no habits scheduled"
                      : `${hovered.completed} of ${hovered.scheduled} completed`
                  }`
                : "Hover a day for details"}
            </span>
            <div className="flex items-center gap-1">
              <span>Less</span>
              {[0, 1, 2, 3, 4].map((level) => (
                <span
                  key={level}
                  className="h-3 w-3 rounded-[3px]"
                  style={{ backgroundColor: `var(--heatmap-${level})` }}
                />
              ))}
              <span>More</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {heatmap.monthly.map((month) => (
          <Card key={month.month} className="p-4">
            <p className="text-xs font-medium text-muted">{MONTHS[month.month]}</p>
            <p className="mt-1 text-lg font-semibold">{month.rate}%</p>
            <p className="text-xs text-muted">
              {month.completed}/{month.scheduled} scheduled check-ins
            </p>
          </Card>
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold">
          {selected ? formatDisplayDate(selected) : "Select a day"}
        </h2>
        {!selected ? null : selectedHabits.length === 0 ? (
          <Card className="p-5 text-sm text-muted">
            No habits were scheduled on this day. Routina does not count it as missed.
          </Card>
        ) : (
          <div className="space-y-2">
            {selectedHabits.map(({ habit, completed }) => (
              <Card key={habit.id} className="flex items-center gap-3 p-3">
                <HabitGlyph name={habit.icon} color={habit.color} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{habit.name}</p>
                  <p className="text-xs text-muted">
                    {describeFrequency(habit.frequency, weekStartsOn)}
                  </p>
                </div>
                <span
                  className={cn(
                    "text-xs font-medium",
                    completed ? "text-primary" : "text-muted",
                  )}
                >
                  {completed ? "Completed" : selected > today ? "Upcoming" : "Not completed"}
                </span>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function cellColor(cell: HeatmapCell): string {
  if (cell.scheduled === 0) return "var(--heatmap-0)";
  if (cell.missed) return "var(--heatmap-missed)";
  return `var(--heatmap-${cell.level})`;
}
