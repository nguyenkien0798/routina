"use client";

import { Check, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { formatDisplayDate } from "@/lib/dates";
import {
  describeTaskDue,
  formatTaskTime,
  isTaskOverdue,
} from "@/lib/tasks";
import type { Task } from "@/types";

const PRIORITY_STYLES: Record<
  Task["priority"],
  { chip: string; rail: string }
> = {
  none: {
    chip: "bg-muted/20 text-muted",
    rail: "var(--border-strong)",
  },
  low: {
    chip: "bg-primary/10 text-primary",
    rail: "var(--primary)",
  },
  medium: {
    chip: "bg-accent-soft text-accent",
    rail: "var(--accent)",
  },
  high: {
    chip: "bg-danger/10 text-danger",
    rail: "var(--danger)",
  },
};

export function TaskRow({
  task,
  today,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: Task;
  today: string;
  onToggle: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const done = task.status === "done";
  const overdue = !done && isTaskOverdue(task);
  const priority = PRIORITY_STYLES[task.priority];

  return (
    <Card
      className={cn(
        "row-interactive relative flex items-center gap-3 overflow-hidden border-transparent bg-surface p-3.5 sm:p-4",
        done && "opacity-80",
      )}
    >
      <span
        aria-hidden
        className="absolute inset-y-3 left-0 w-[3px] rounded-r-full"
        style={{ backgroundColor: overdue ? "var(--danger)" : priority.rail }}
      />
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={done}
        aria-label={done ? `Reopen ${task.title}` : `Complete ${task.title}`}
        className={cn(
          "check-pop ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border",
          done
            ? "border-transparent bg-primary text-primary-foreground shadow-[var(--shadow-xs)]"
            : "border-border bg-background/80 text-muted hover:border-primary/45 hover:text-primary",
        )}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm font-medium tracking-[-0.01em]",
            done && "text-muted line-through decoration-muted/60",
          )}
        >
          {task.title}
        </p>
        <p
          className={cn(
            "truncate text-[12px]",
            overdue ? "text-danger" : "text-muted",
          )}
        >
          {describeTaskDue(task, today)}
          {` · ${formatDisplayDate(task.startDate)} ${formatTaskTime(task.startTime)} → ${formatDisplayDate(task.dueDate)} ${formatTaskTime(task.dueTime)}`}
        </p>
      </div>

      {task.priority !== "none" ? (
        <span
          className={cn(
            "hidden rounded-[10px] px-2 py-1 text-[11px] font-medium capitalize sm:inline",
            priority.chip,
          )}
        >
          {task.priority}
        </span>
      ) : null}

      {onEdit || onDelete ? (
        <div className="flex shrink-0 items-center gap-0.5">
          {onEdit ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={`Edit ${task.title}`}
              onClick={onEdit}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          ) : null}
          {onDelete ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={`Delete ${task.title}`}
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
