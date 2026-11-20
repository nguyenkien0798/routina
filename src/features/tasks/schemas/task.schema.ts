import { z } from "zod";
import {
  DEFAULT_DUE_TIME,
  DEFAULT_START_TIME,
} from "@/lib/tasks";
import type { CreateTaskInput, Task, TaskPriority } from "@/types";

const timeSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Choose a valid time");

export const taskFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Task title is required")
      .max(120, "Keep it under 120 characters"),
    notes: z.string().max(500, "Keep it under 500 characters"),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid start date"),
    startTime: timeSchema,
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid due date"),
    dueTime: timeSchema,
    priority: z.enum(["none", "low", "medium", "high"]),
  })
  .superRefine((value, ctx) => {
    const start = `${value.startDate}T${value.startTime}`;
    const due = `${value.dueDate}T${value.dueTime}`;
    if (due < start) {
      ctx.addIssue({
        code: "custom",
        path: ["dueTime"],
        message: "End must be on or after the start",
      });
    }
  });

export type TaskFormValues = z.infer<typeof taskFormSchema>;

export function defaultTaskFormValues(today: string): TaskFormValues {
  return {
    title: "",
    notes: "",
    startDate: today,
    startTime: DEFAULT_START_TIME,
    dueDate: today,
    dueTime: DEFAULT_DUE_TIME,
    priority: "none",
  };
}

export function taskToFormValues(task: Task): TaskFormValues {
  return {
    title: task.title,
    notes: task.notes,
    startDate: task.startDate,
    startTime: task.startTime ?? DEFAULT_START_TIME,
    dueDate: task.dueDate,
    dueTime: task.dueTime ?? DEFAULT_DUE_TIME,
    priority: task.priority,
  };
}

export function toCreateTaskInput(values: TaskFormValues): CreateTaskInput {
  return {
    title: values.title.trim(),
    notes: values.notes.trim(),
    startDate: values.startDate,
    startTime: values.startTime,
    dueDate: values.dueDate,
    dueTime: values.dueTime,
    priority: values.priority satisfies TaskPriority,
  };
}
