"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Flame, Leaf, ListTodo, Plus, Trophy } from "lucide-react";
import { HabitGlyph } from "@/components/common/habit-icon";
import { SectionHeading } from "@/components/layout/section-heading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/cn";
import { WEEKDAY_LABELS } from "@/lib/constants";
import {
  addDaysToDateString,
  endOfCalendarWeek,
  formatDisplayDate,
  getWeekday,
  startOfCalendarWeek,
  todayString,
} from "@/lib/dates";
import { describeFrequency, getScheduledHabits } from "@/lib/frequency";
import { getTasksForToday } from "@/lib/tasks";
import { TaskForm } from "@/features/tasks/components/task-form";
import { TaskRow } from "@/features/tasks/components/task-row";
import {
  defaultTaskFormValues,
  toCreateTaskInput,
  type TaskFormValues,
} from "@/features/tasks/schemas/task.schema";
import { useHabitStore } from "@/stores/habit.store";
import { useSettingsStore } from "@/stores/settings.store";
import { useTaskStore } from "@/stores/task.store";
import {
  calculateCurrentStreak,
  calculateDailyProgress,
  calculateHabitCurrentStreak,
  calculateLongestStreak,
} from "@/utils/stats";
import { useI18n } from "@/i18n/use-i18n";
import type { CheckIn, Habit } from "@/types";

function greetingKey(hour: number) {
  if (hour < 12) return "greetings.morning";
  if (hour < 18) return "greetings.afternoon";
  return "greetings.evening";
}

export function DashboardView() {
  const router = useRouter();
  const { t } = useI18n();
  const habits = useHabitStore((state) => state.habits);
  const checkIns = useHabitStore((state) => state.checkIns);
  const toggleCheckIn = useHabitStore((state) => state.toggleCheckIn);
  const seedDemo = useHabitStore((state) => state.seedDemo);
  const tasks = useTaskStore((state) => state.tasks);
  const createTask = useTaskStore((state) => state.createTask);
  const toggleTask = useTaskStore((state) => state.toggleTask);
  const weekStartsOn = useSettingsStore((state) => state.settings?.weekStartsOn ?? 1);
  const [now] = useState(() => new Date());
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const today = todayString(now);

  const scheduled = useMemo(
    () => getScheduledHabits(habits, today),
    [habits, today],
  );
  const todayTasks = useMemo(
    () => getTasksForToday(tasks, today),
    [tasks, today],
  );
  const progress = useMemo(
    () => calculateDailyProgress(habits, checkIns, today),
    [habits, checkIns, today],
  );
  const currentStreak = useMemo(
    () => calculateCurrentStreak(habits, checkIns, today),
    [habits, checkIns, today],
  );
  const longestStreak = useMemo(
    () => calculateLongestStreak(habits, checkIns, today),
    [habits, checkIns, today],
  );
  const weekly = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = addDaysToDateString(today, index - 6);
      const dayProgress = calculateDailyProgress(habits, checkIns, date);
      return { date, ...dayProgress, weekday: getWeekday(date) };
    });
  }, [habits, checkIns, today]);

  async function handleSeed() {
    try {
      await seedDemo();
      toast.success(t("today.demoReady"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("today.demoFailed"));
    }
  }

  async function handleCreateTask(values: TaskFormValues) {
    try {
      await createTask(toCreateTaskInput(values));
      toast.success(t("today.taskAdded"));
      setCreateTaskOpen(false);
    } catch {
      toast.error(t("today.taskCreateFailed"));
    }
  }

  if (habits.length === 0 && tasks.length === 0) {
    return (
      <>
        <EmptyState
          icon={<Leaf className="h-5 w-5" />}
          title={t("today.emptyTitle")}
          description={t("today.emptyDescription")}
          actionLabel={t("today.createHabit")}
          onAction={() => router.push("/habits")}
          secondaryLabel={t("today.addTask")}
          onSecondary={() => setCreateTaskOpen(true)}
        />
        <div className="mt-4 flex justify-center">
          <Button variant="ghost" size="sm" onClick={() => void handleSeed()}>
            {t("today.loadDemo")}
          </Button>
        </div>
        <Dialog
          open={createTaskOpen}
          title={t("today.newTask")}
          description={t("today.newTaskHint")}
          onClose={() => setCreateTaskOpen(false)}
        >
          <TaskForm
            defaultValues={defaultTaskFormValues(today)}
            weekStartsOn={weekStartsOn}
            submitLabel={t("tasks.addTask")}
            onCancel={() => setCreateTaskOpen(false)}
            onSubmit={handleCreateTask}
          />
        </Dialog>
      </>
    );
  }

  const openTaskCount = todayTasks.filter((task) => task.status === "open").length;

  return (
    <div className="space-y-9">
      <section className="relative overflow-hidden rounded-[28px] border border-border bg-[linear-gradient(145deg,#3d7a5a_0%,#4a8f6a_45%,#3d7f88_100%)] px-5 py-7 text-primary-foreground shadow-[var(--shadow-sm)] sm:px-8 sm:py-9">
        <div
          aria-hidden
          className="animate-bob pointer-events-none absolute top-6 right-8 h-20 w-20 rounded-[22px] bg-lime/70"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-32 bottom-8 hidden h-14 w-14 rotate-12 rounded-full bg-white/15 lg:block"
        />
        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="text-[13px] font-medium tracking-[0.03em] text-white/75 uppercase">
              {formatDisplayDate(today)}
            </p>
            <h1 className="font-display mt-3 text-[2.3rem] leading-[1.02] font-bold tracking-[-0.045em] sm:text-[2.9rem]">
              {t("today.greeting", { greeting: t(greetingKey(now.getHours())) })}
            </h1>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/80">
              {t("today.subtitle")}
            </p>
            {habits.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2.5">
                <span className="inline-flex items-center gap-2 rounded-[12px] bg-lime px-3.5 py-2 text-sm font-semibold text-lime-ink">
                  <Flame className="h-3.5 w-3.5" strokeWidth={2} />
                  <span className="tabular-nums">{currentStreak}</span>
                  <span>
                    {currentStreak === 1 ? t("today.day") : t("today.days")}
                  </span>
                </span>
                <span className="inline-flex items-center gap-2 rounded-[12px] bg-white/15 px-3.5 py-2 text-sm font-semibold text-white">
                  <Trophy className="h-3.5 w-3.5" strokeWidth={2} />
                  <span className="tabular-nums">{longestStreak}</span>
                  <span className="text-white/80">
                    {longestStreak === 1 ? t("today.day") : t("today.days")}
                  </span>
                </span>
              </div>
            ) : null}
          </div>

          {habits.length > 0 ? (
            <div className="flex items-center gap-4 rounded-[22px] border border-white/20 bg-white/10 p-4 backdrop-blur-sm sm:gap-5 sm:px-5 sm:py-5">
              <ProgressRing value={progress.percentage} />
              <div>
                <p className="text-[12px] font-medium tracking-[0.05em] text-white/70 uppercase">
                  {t("today.habitProgress")}
                </p>
                <p className="font-display mt-1 text-[2rem] leading-none font-bold tracking-[-0.03em]">
                  {progress.completed}
                  <span className="text-[1.1rem] text-white/70">
                    {" "}
                    {t("today.of")} {progress.total}
                  </span>
                </p>
                <Progress className="mt-3 w-40" value={progress.percentage} color="var(--lime)" />
                <p className="mt-2 max-w-[14rem] text-[13px] leading-snug text-white/75">
                  {progress.total === 0
                    ? t("today.nothingScheduled")
                    : progress.percentage === 100
                      ? t("today.allHabitsDone")
                      : t("today.habitsPercent", {
                          percent: progress.percentage,
                        })}
                  {openTaskCount > 0
                    ? ` · ${t("today.openTasks", {
                        count: openTaskCount,
                        label:
                          openTaskCount === 1
                            ? t("today.task")
                            : t("today.tasks"),
                      })}`
                    : ""}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-7">
        <section className="panel-moss rounded-[24px] border border-border p-4 shadow-[var(--shadow-sm)] sm:p-5">
          <SectionHeading
            tone="moss"
            eyebrow={t("today.habitsSection")}
            title={t("today.todaysRoutines")}
            action={
              <Button variant="ghost" size="sm" onClick={() => router.push("/habits")}>
                {t("common.manage")}
              </Button>
            }
          />
          {habits.length === 0 ? (
            <div className="flex items-start gap-3 rounded-[18px] border border-dashed border-primary/25 bg-surface/60 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-primary text-primary-foreground">
                <Leaf className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{t("today.noHabitsYet")}</p>
                <p className="mt-1 text-sm text-muted">{t("today.noHabitsHint")}</p>
                <Button
                  className="mt-3"
                  size="sm"
                  variant="secondary"
                  onClick={() => router.push("/habits")}
                >
                  {t("today.createHabit")}
                </Button>
              </div>
            </div>
          ) : scheduled.length === 0 ? (
            <p className="rounded-[18px] border border-dashed border-border bg-surface/50 px-4 py-5 text-sm text-muted">
              {t("today.noHabitsScheduled")}
            </p>
          ) : (
            <div className="stagger-children space-y-2.5">
              {scheduled.map((habit) => (
                <TodayHabitRow
                  key={habit.id}
                  habit={habit}
                  today={today}
                  weekStartsOn={weekStartsOn}
                  completed={checkIns.some(
                    (item) =>
                      item.habitId === habit.id &&
                      item.date === today &&
                      item.completed,
                  )}
                  checkIns={checkIns}
                  onToggle={() => {
                    void toggleCheckIn(habit.id, today).catch(() => {
                      toast.error(t("today.checkInFailed"));
                    });
                  }}
                />
              ))}
            </div>
          )}
        </section>

        <section className="panel-sand rounded-[24px] border border-border p-4 shadow-[var(--shadow-sm)] sm:p-5">
          <SectionHeading
            tone="sand"
            eyebrow={t("today.tasksSection")}
            title={t("today.dueNow")}
            action={
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => router.push("/tasks")}>
                  {t("today.allTasks")}
                </Button>
                <Button size="sm" onClick={() => setCreateTaskOpen(true)}>
                  <Plus className="h-3.5 w-3.5" />
                  {t("common.add")}
                </Button>
              </div>
            }
          />
          {todayTasks.length === 0 ? (
            <div className="flex items-start gap-3 rounded-[18px] border border-dashed border-accent/30 bg-surface/60 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-accent-soft text-accent">
                <ListTodo className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{t("today.noTasksToday")}</p>
                <p className="mt-1 text-sm text-muted">{t("today.noTasksHint")}</p>
                <Button
                  className="mt-3"
                  size="sm"
                  variant="secondary"
                  onClick={() => setCreateTaskOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t("today.addTask")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="stagger-children space-y-2.5">
              {todayTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  today={today}
                  onToggle={() => {
                    void toggleTask(task.id).catch(() => {
                      toast.error(t("today.taskUpdateFailed"));
                    });
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {habits.length > 0 ? (
        <section className="panel-ink rounded-[24px] border border-border p-4 shadow-[var(--shadow-sm)] sm:p-5">
          <SectionHeading
            tone="ink"
            eyebrow={t("today.rhythm")}
            title={t("today.last7Days")}
          />
          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {weekly.map((day) => (
              <div key={day.date} className="flex flex-col items-center gap-2">
                <span
                  className={cn(
                    "text-[11px] font-medium",
                    day.date === today ? "text-primary" : "text-muted",
                  )}
                >
                  {WEEKDAY_LABELS[day.weekday].short.slice(0, 2)}
                </span>
                <div
                  className={cn(
                    "flex h-[96px] w-full items-end justify-center rounded-[16px] p-1.5",
                    day.date === today
                      ? "bg-primary/12 ring-1 ring-primary/25"
                      : "bg-background/75",
                  )}
                >
                  <div
                    className="w-full rounded-[11px] transition-[height] duration-500 ease-out"
                    style={{
                      height: `${day.percentage === 0 ? 10 : Math.max(day.percentage, 12)}%`,
                      opacity: day.percentage === 0 ? 0.28 : 1,
                      background:
                        day.date === today
                          ? "var(--primary)"
                          : `linear-gradient(180deg, color-mix(in srgb, var(--accent) 55%, var(--primary)), var(--primary))`,
                    }}
                  />
                </div>
                <span className="font-display text-[12px] tabular-nums text-muted">
                  {day.total === 0 ? "—" : `${day.percentage}%`}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <Dialog
        open={createTaskOpen}
        title={t("today.newTask")}
        description={t("today.newTaskHint")}
        onClose={() => setCreateTaskOpen(false)}
      >
        <TaskForm
          defaultValues={defaultTaskFormValues(today)}
          weekStartsOn={weekStartsOn}
          submitLabel={t("tasks.addTask")}
          onCancel={() => setCreateTaskOpen(false)}
          onSubmit={handleCreateTask}
        />
      </Dialog>
    </div>
  );
}

function TodayHabitRow({
  habit,
  today,
  weekStartsOn,
  completed,
  checkIns,
  onToggle,
}: {
  habit: Habit;
  today: string;
  weekStartsOn: 0 | 1 | 6;
  completed: boolean;
  checkIns: CheckIn[];
  onToggle: () => void;
}) {
  const { t } = useI18n();
  const streak = calculateHabitCurrentStreak(habit, checkIns, today, weekStartsOn);
  const weeklyNote =
    habit.frequency.type === "weekly_target"
      ? weeklyTargetProgress(habit.id, habit.frequency.timesPerWeek, checkIns, today, weekStartsOn)
      : null;

  return (
    <Card
      className={cn(
        "row-interactive relative flex items-center gap-3 overflow-hidden border-transparent p-3.5 sm:p-4",
        completed ? "bg-surface/90" : "bg-surface",
      )}
      style={{
        backgroundImage: `linear-gradient(90deg, color-mix(in srgb, ${habit.color} ${completed ? 18 : 12}%, transparent), transparent 42%)`,
      }}
    >
      <span
        aria-hidden
        className="absolute inset-y-3 left-0 w-[3px] rounded-r-full"
        style={{ backgroundColor: habit.color }}
      />
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={completed}
        aria-label={completed ? `Undo ${habit.name}` : `Complete ${habit.name}`}
        className={cn(
          "check-pop ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border",
          completed
            ? "border-transparent text-white shadow-[var(--shadow-xs)]"
            : "border-border bg-background/80 text-muted hover:text-foreground",
        )}
        style={
          completed
            ? { backgroundColor: habit.color }
            : { borderColor: `color-mix(in srgb, ${habit.color} 35%, var(--border))` }
        }
      >
        <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
      </button>
      <HabitGlyph name={habit.icon} color={habit.color} size="sm" />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm font-medium tracking-[-0.01em]",
            completed && "text-muted line-through decoration-muted/60",
          )}
        >
          {habit.name}
        </p>
        <p className="truncate text-[12px] text-muted">
          {describeFrequency(habit.frequency, weekStartsOn)}
          {habit.target ? ` · ${habit.target.value} ${habit.target.unit}` : ""}
          {weeklyNote ? ` · ${weeklyNote}` : ""}
        </p>
      </div>
      <span
        className="hidden rounded-[10px] px-2 py-1 text-[11px] font-medium tabular-nums sm:inline"
        style={{
          backgroundColor: `color-mix(in srgb, ${habit.color} 14%, transparent)`,
          color: habit.color,
        }}
      >
        {streak}{" "}
        {habit.frequency.type === "weekly_target"
          ? t("today.weekStreak")
          : t("today.dayStreak")}
      </span>
    </Card>
  );
}

function weeklyTargetProgress(
  habitId: string,
  timesPerWeek: number,
  checkIns: CheckIn[],
  today: string,
  weekStartsOn: 0 | 1 | 6,
) {
  const start = startOfCalendarWeek(today, weekStartsOn);
  const end = endOfCalendarWeek(today, weekStartsOn);
  const count = checkIns.filter(
    (item) =>
      item.habitId === habitId &&
      item.completed &&
      item.date >= start &&
      item.date <= end,
  ).length;
  return `${count}/${timesPerWeek} this week`;
}

function ProgressRing({ value }: { value: number }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="relative h-[96px] w-[96px] shrink-0">
      <svg viewBox="0 0 88 88" className="h-full w-full -rotate-90">
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.22)"
          strokeWidth="7"
        />
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke="var(--lime)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="animate-progress-ring transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>
      <span className="font-display absolute inset-0 flex items-center justify-center text-sm font-bold tracking-[-0.02em] text-white tabular-nums">
        {value}%
      </span>
    </div>
  );
}
