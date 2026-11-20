"use client";

import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Field, Input, Textarea } from "@/components/ui/input";
import { SelectMenu } from "@/components/ui/select-menu";
import { TimePicker } from "@/components/ui/time-picker";
import {
  taskFormSchema,
  type TaskFormValues,
} from "@/features/tasks/schemas/task.schema";
import { useI18n } from "@/i18n/use-i18n";
import type { WeekStartsOn } from "@/types";

export function TaskForm({
  defaultValues,
  weekStartsOn,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  defaultValues: TaskFormValues;
  weekStartsOn: WeekStartsOn;
  submitLabel: string;
  onSubmit: (values: TaskFormValues) => Promise<void> | void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues,
  });

  const priorityOptions = useMemo(
    () =>
      (
        [
          ["none", "taskForm.priorityNone"],
          ["low", "taskForm.priorityLow"],
          ["medium", "taskForm.priorityMedium"],
          ["high", "taskForm.priorityHigh"],
        ] as const
      ).map(([value, labelKey]) => ({
        value,
        label: t(labelKey),
      })),
    [t],
  );

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit(values);
      })}
    >
      <Field
        label={t("taskForm.title")}
        htmlFor="task-title"
        error={form.formState.errors.title?.message}
      >
        <Input
          id="task-title"
          placeholder={t("taskForm.titlePlaceholder")}
          autoFocus
          {...form.register("title")}
        />
      </Field>

      <Field
        label={t("taskForm.notes")}
        htmlFor="task-notes"
        error={form.formState.errors.notes?.message}
      >
        <Textarea
          id="task-notes"
          placeholder={t("taskForm.notesPlaceholder")}
          {...form.register("notes")}
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("taskForm.startDate")} error={form.formState.errors.startDate?.message}>
          <Controller
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <DatePicker
                value={field.value}
                onChange={field.onChange}
                weekStartsOn={weekStartsOn}
              />
            )}
          />
        </Field>
        <Field label={t("taskForm.startTime")} error={form.formState.errors.startTime?.message}>
          <Controller
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <TimePicker
                id="task-start-time"
                value={field.value}
                onChange={field.onChange}
                aria-label={t("taskForm.startTime")}
              />
            )}
          />
        </Field>
        <Field label={t("taskForm.endDate")} error={form.formState.errors.dueDate?.message}>
          <Controller
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <DatePicker
                value={field.value}
                onChange={field.onChange}
                weekStartsOn={weekStartsOn}
              />
            )}
          />
        </Field>
        <Field label={t("taskForm.endTime")} error={form.formState.errors.dueTime?.message}>
          <Controller
            control={form.control}
            name="dueTime"
            render={({ field }) => (
              <TimePicker
                id="task-due-time"
                value={field.value}
                onChange={field.onChange}
                aria-label={t("taskForm.endTime")}
              />
            )}
          />
        </Field>
      </div>
      <p className="text-[12px] leading-relaxed text-muted">{t("taskForm.remindHint")}</p>

      <Field label={t("taskForm.priority")} error={form.formState.errors.priority?.message}>
        <Controller
          control={form.control}
          name="priority"
          render={({ field }) => (
            <SelectMenu
              value={field.value}
              onChange={(next) => field.onChange(next)}
              options={priorityOptions}
            />
          )}
        />
      </Field>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? t("common.working") : submitLabel}
        </Button>
      </div>
    </form>
  );
}