"use client";

import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Field, Input, Textarea } from "@/components/ui/input";
import { SelectMenu } from "@/components/ui/select-menu";
import { HabitIcon } from "@/components/common/habit-icon";
import {
  HABIT_CATEGORIES,
  HABIT_COLORS,
  HABIT_ICON_NAMES,
  WEEKDAY_LABELS,
} from "@/lib/constants";
import { weekdayOrder } from "@/lib/dates";
import { cn } from "@/lib/cn";
import {
  habitFormSchema,
  type HabitFormValues,
} from "@/features/habits/schemas/habit.schema";
import type { WeekStartsOn } from "@/types";

export function HabitForm({
  defaultValues,
  weekStartsOn,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  defaultValues: HabitFormValues;
  weekStartsOn: WeekStartsOn;
  submitLabel: string;
  onSubmit: (values: HabitFormValues) => Promise<void> | void;
  onCancel: () => void;
}) {
  const form = useForm<HabitFormValues>({
    resolver: zodResolver(habitFormSchema),
    defaultValues,
  });
  const frequencyType = useWatch({ control: form.control, name: "frequencyType" });
  const hasTarget = useWatch({ control: form.control, name: "hasTarget" });
  const days = weekdayOrder(weekStartsOn);

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit(values);
      })}
    >
      <Field label="Habit name" htmlFor="habit-name" error={form.formState.errors.name?.message}>
        <Input id="habit-name" placeholder="Read 20 pages" {...form.register("name")} />
      </Field>

      <Field
        label="Description"
        htmlFor="habit-description"
        error={form.formState.errors.description?.message}
      >
        <Textarea
          id="habit-description"
          placeholder="A short note to remind you why this matters."
          {...form.register("description")}
        />
      </Field>

      <div>
        <p className="mb-2 text-sm font-medium">Icon</p>
        <Controller
          control={form.control}
          name="icon"
          render={({ field }) => (
            <div className="grid grid-cols-8 gap-2">
              {HABIT_ICON_NAMES.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => field.onChange(icon)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl border transition-colors",
                    field.value === icon
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted hover:text-foreground",
                  )}
                  aria-label={icon}
                >
                  <HabitIcon name={icon} size={16} />
                </button>
              ))}
            </div>
          )}
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Color</p>
        <Controller
          control={form.control}
          name="color"
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {HABIT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={color}
                  onClick={() => field.onChange(color)}
                  className={cn(
                    "h-7 w-7 rounded-full border-2",
                    field.value === color ? "border-foreground" : "border-transparent",
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}
        />
      </div>

      <Field label="Category" htmlFor="habit-category">
        <Controller
          control={form.control}
          name="category"
          render={({ field }) => (
            <SelectMenu
              id="habit-category"
              value={field.value}
              onChange={field.onChange}
              options={HABIT_CATEGORIES.map((category) => ({
                value: category,
                label: category,
              }))}
            />
          )}
        />
      </Field>

      <div>
        <p className="mb-2 text-sm font-medium">Frequency</p>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["daily", "Daily"],
              ["weekly_days", "Days"],
              ["weekly_target", "Weekly"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={cn(
                "h-10 rounded-xl border text-sm font-medium tracking-[-0.01em] transition-colors duration-150",
                frequencyType === value
                  ? "border-primary/40 bg-primary-soft text-primary"
                  : "border-border text-muted hover:border-border-strong hover:text-foreground",
              )}
              onClick={() => form.setValue("frequencyType", value)}
            >
              {label}
            </button>
          ))}
        </div>
        {frequencyType === "weekly_days" ? (
          <div className="mt-3">
            <Controller
              control={form.control}
              name="weekDays"
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {days.map((day) => {
                    const selected = field.value.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        className={cn(
                          "h-9 min-w-9 rounded-full border px-2 text-xs font-medium transition-colors duration-150",
                          selected
                            ? "border-primary bg-primary text-primary-foreground shadow-[var(--shadow-xs)]"
                            : "border-border text-muted hover:border-border-strong hover:text-foreground",
                        )}
                        onClick={() => {
                          const next = selected
                            ? field.value.filter((item) => item !== day)
                            : [...field.value, day];
                          field.onChange(next);
                        }}
                      >
                        {WEEKDAY_LABELS[day].short}
                      </button>
                    );
                  })}
                </div>
              )}
            />
            {form.formState.errors.weekDays ? (
              <p className="mt-1 text-xs text-danger">
                {form.formState.errors.weekDays.message}
              </p>
            ) : null}
          </div>
        ) : null}
        {frequencyType === "weekly_target" ? (
          <Field label="Times per week" htmlFor="times-per-week" error={form.formState.errors.timesPerWeek?.message}>
            <Input
              id="times-per-week"
              type="number"
              min={1}
              max={7}
              className="mt-3"
              {...form.register("timesPerWeek", { valueAsNumber: true })}
            />
          </Field>
        ) : null}
      </div>

      <Field label="Start date" htmlFor="start-date" error={form.formState.errors.startDate?.message}>
        <Controller
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <DatePicker
              id="start-date"
              value={field.value}
              onChange={field.onChange}
              weekStartsOn={weekStartsOn}
            />
          )}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...form.register("hasTarget")} />
        Add a target
      </label>
      {hasTarget ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Value" htmlFor="target-value" error={form.formState.errors.targetValue?.message}>
            <Input
              id="target-value"
              type="number"
              min={0}
              step="any"
              {...form.register("targetValue", { valueAsNumber: true })}
            />
          </Field>
          <Field label="Unit" htmlFor="target-unit" error={form.formState.errors.targetUnit?.message}>
            <Input id="target-unit" placeholder="pages" {...form.register("targetUnit")} />
          </Field>
        </div>
      ) : null}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
