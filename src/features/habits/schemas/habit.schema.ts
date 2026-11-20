import { z } from "zod";
import { HABIT_CATEGORIES, HABIT_COLORS, HABIT_ICON_NAMES } from "@/lib/constants";
import type { CreateHabitInput, Frequency, HabitTarget } from "@/types";

const weekdaySchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]);

export const habitFormSchema = z
  .object({
    name: z.string().trim().min(1, "Habit name is required").max(80, "Keep it under 80 characters"),
    description: z.string().max(280, "Keep it under 280 characters"),
    icon: z.enum(HABIT_ICON_NAMES),
    color: z.enum(HABIT_COLORS),
    category: z.enum(HABIT_CATEGORIES),
    frequencyType: z.enum(["daily", "weekly_days", "weekly_target"]),
    weekDays: z.array(weekdaySchema),
    timesPerWeek: z.number().int().min(1).max(7),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid start date"),
    hasTarget: z.boolean(),
    targetValue: z.union([z.number(), z.null()]),
    targetUnit: z.string().max(24),
  })
  .superRefine((value, ctx) => {
    if (value.frequencyType === "weekly_days" && value.weekDays.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["weekDays"],
        message: "Select at least one day",
      });
    }
    if (value.hasTarget) {
      if (!value.targetValue || Number.isNaN(value.targetValue) || value.targetValue <= 0) {
        ctx.addIssue({
          code: "custom",
          path: ["targetValue"],
          message: "Enter a target value",
        });
      }
      if (!value.targetUnit.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["targetUnit"],
          message: "Enter a unit, such as pages or minutes",
        });
      }
    }
  });

export type HabitFormValues = z.infer<typeof habitFormSchema>;

export function defaultHabitFormValues(today: string): HabitFormValues {
  return {
    name: "",
    description: "",
    icon: "sparkles",
    color: "#43865A",
    category: "Lifestyle",
    frequencyType: "daily",
    weekDays: [1, 2, 3, 4, 5],
    timesPerWeek: 3,
    startDate: today,
    hasTarget: false,
    targetValue: null,
    targetUnit: "",
  };
}

export function toCreateHabitInput(values: HabitFormValues): CreateHabitInput {
  let frequency: Frequency;
  if (values.frequencyType === "weekly_days") {
    frequency = {
      type: "weekly_days",
      days: [...values.weekDays].sort((a, b) => a - b),
    };
  } else if (values.frequencyType === "weekly_target") {
    frequency = { type: "weekly_target", timesPerWeek: values.timesPerWeek };
  } else {
    frequency = { type: "daily" };
  }

  const target: HabitTarget | null = values.hasTarget && values.targetValue
    ? { value: values.targetValue, unit: values.targetUnit.trim() }
    : null;

  return {
    name: values.name.trim(),
    description: values.description.trim(),
    icon: values.icon,
    color: values.color,
    category: values.category,
    frequency,
    startDate: values.startDate,
    target,
  };
}

const weekdayEntitySchema = weekdaySchema;

export const frequencyEntitySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("daily") }),
  z.object({
    type: z.literal("weekly_days"),
    days: z.array(weekdayEntitySchema).min(1),
  }),
  z.object({
    type: z.literal("weekly_target"),
    timesPerWeek: z.number().int().min(1).max(7),
  }),
]);

export const habitEntitySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(80),
  description: z.string(),
  icon: z.string().min(1),
  color: z.string().regex(/^#([0-9a-fA-F]{6})$/),
  category: z.string().min(1),
  frequency: frequencyEntitySchema,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  target: z
    .object({
      value: z.number().positive(),
      unit: z.string().min(1).max(24),
    })
    .nullable(),
  archived: z.boolean(),
  sortOrder: z.number(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const checkInEntitySchema = z.object({
  id: z.string().min(1),
  habitId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  completed: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const settingsEntitySchema = z.object({
  id: z.literal("default"),
  theme: z.enum(["light", "dark", "system"]),
  weekStartsOn: z.union([z.literal(0), z.literal(1), z.literal(6)]),
  browserNotifications: z.boolean().default(false),
  locale: z.enum(["en", "vi"]).default("en"),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const taskEntitySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(120),
  notes: z.string(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).default("08:30"),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dueTime: z.string().regex(/^\d{2}:\d{2}$/).default("17:30"),
  status: z.enum(["open", "done"]),
  priority: z.enum(["none", "low", "medium", "high"]),
  completedAt: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const exportPayloadSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string().min(1),
  habits: z.array(habitEntitySchema),
  checkIns: z.array(checkInEntitySchema),
  tasks: z.array(taskEntitySchema).default([]),
  settings: settingsEntitySchema,
});
