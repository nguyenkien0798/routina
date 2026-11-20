"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, type ReactNode } from "react";
import { Flame, Sparkles, Target, Trophy } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { SelectMenu } from "@/components/ui/select-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { WEEKDAY_LABELS } from "@/lib/constants";
import { addDaysToDateString, addMonthsToDateString, todayString } from "@/lib/dates";
import { useI18n } from "@/i18n/use-i18n";
import { useHabitStore } from "@/stores/habit.store";
import { useSettingsStore } from "@/stores/settings.store";
import {
  calculateCompletionRate,
  calculateCurrentStreak,
  calculateHabitStatistics,
  calculateLongestStreak,
  countTotalCheckIns,
  getBestPerformingHabit,
  getMonthlyStatistics,
  getMostConsistentWeekday,
  getWeeklyStatistics,
} from "@/utils/stats";

const InsightsCharts = dynamic(
  () =>
    import("@/features/insights/components/insights-charts").then(
      (module) => module.InsightsCharts,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-80 w-full rounded-2xl" />
        ))}
      </div>
    ),
  },
);

type RangeKey = "7" | "30" | "90" | "365" | "custom";

export function InsightsView() {
  const { t } = useI18n();
  const habits = useHabitStore((state) => state.habits);
  const checkIns = useHabitStore((state) => state.checkIns);
  const weekStartsOn = useSettingsStore((state) => state.settings?.weekStartsOn ?? 1);
  const today = todayString();
  const [range, setRange] = useState<RangeKey>("30");
  const [customFrom, setCustomFrom] = useState(addDaysToDateString(today, -29));
  const [customTo, setCustomTo] = useState(today);

  const { from, to } = useMemo(() => {
    if (range === "custom") {
      return {
        from: customFrom <= customTo ? customFrom : customTo,
        to: customFrom <= customTo ? customTo : customFrom,
      };
    }
    if (range === "365") {
      return { from: addMonthsToDateString(today, -12), to: today };
    }
    const days = Number(range);
    return { from: addDaysToDateString(today, -(days - 1)), to: today };
  }, [range, customFrom, customTo, today]);

  const active = habits.filter((habit) => !habit.archived);
  const currentStreak = calculateCurrentStreak(habits, checkIns, today);
  const longestStreak = calculateLongestStreak(habits, checkIns, today);
  const completionRate = calculateCompletionRate(
    habits,
    checkIns,
    from,
    to,
    today,
    weekStartsOn,
  );
  const totalCheckIns = countTotalCheckIns(
    checkIns,
    from,
    to,
    today,
    new Set(active.map((habit) => habit.id)),
  );
  const best = getBestPerformingHabit(habits, checkIns, from, to, today, weekStartsOn);
  const weekday = getMostConsistentWeekday(habits, checkIns, from, to, today);
  const weekly = getWeeklyStatistics(habits, checkIns, from, to, today, weekStartsOn);
  const monthly = getMonthlyStatistics(habits, checkIns, from, to, today);
  const comparison = active.map((habit) =>
    calculateHabitStatistics(habit, checkIns, from, to, today, weekStartsOn),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("insights.title")}
        description={t("insights.description")}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 text-sm font-medium">
          Range
          <SelectMenu
            className="mt-1.5"
            value={range}
            onChange={(next) => setRange(next as RangeKey)}
            options={[
              { value: "7", label: "Last 7 days" },
              { value: "30", label: "Last 30 days" },
              { value: "90", label: "Last 90 days" },
              { value: "365", label: "Last 12 months" },
              { value: "custom", label: "Custom range" },
            ]}
          />
        </label>
        {range === "custom" ? (
          <>
            <label className="flex-1 text-sm font-medium">
              From
              <DatePicker
                className="mt-1.5"
                value={customFrom}
                max={today}
                weekStartsOn={weekStartsOn}
                onChange={setCustomFrom}
              />
            </label>
            <label className="flex-1 text-sm font-medium">
              To
              <DatePicker
                className="mt-1.5"
                value={customTo}
                max={today}
                weekStartsOn={weekStartsOn}
                onChange={setCustomTo}
              />
            </label>
          </>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Flame className="h-4 w-4" />} label="Current streak" value={`${currentStreak}d`} />
        <StatCard icon={<Trophy className="h-4 w-4" />} label="Longest streak" value={`${longestStreak}d`} />
        <StatCard icon={<Target className="h-4 w-4" />} label="Completion rate" value={`${completionRate}%`} />
        <StatCard icon={<Sparkles className="h-4 w-4" />} label="Total check-ins" value={String(totalCheckIns)} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="p-4">
          <p className="text-xs font-medium text-muted">Best performing habit</p>
          <p className="mt-2 text-lg font-semibold">
            {best ? best.name : "Not enough data yet"}
          </p>
          <p className="text-sm text-muted">
            {best ? `${best.completionRate}% completion in this range` : "Complete a few habits to see a leader."}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-muted">Most consistent weekday</p>
          <p className="mt-2 text-lg font-semibold">
            {weekday ? WEEKDAY_LABELS[weekday.weekday].full : "Not enough data yet"}
          </p>
          <p className="text-sm text-muted">
            {weekday
              ? `${Math.round(weekday.rate * 100)}% of scheduled habits completed`
              : "Check in across the week to find your strongest day."}
          </p>
        </Card>
      </div>

      <InsightsCharts weekly={weekly} monthly={monthly} comparison={comparison} />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-muted">
        {icon}
        <p className="text-xs font-medium">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    </Card>
  );
}
