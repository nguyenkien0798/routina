"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ListTodo, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { SelectMenu } from "@/components/ui/select-menu";
import { todayString } from "@/lib/dates";
import { TaskForm } from "@/features/tasks/components/task-form";
import { TaskRow } from "@/features/tasks/components/task-row";
import {
  defaultTaskFormValues,
  taskToFormValues,
  toCreateTaskInput,
  type TaskFormValues,
} from "@/features/tasks/schemas/task.schema";
import { useI18n } from "@/i18n/use-i18n";
import { useSettingsStore } from "@/stores/settings.store";
import { useTaskStore } from "@/stores/task.store";
import type { Task } from "@/types";

type StatusFilter = "open" | "done" | "all";

export function TasksView() {
  const { t } = useI18n();
  const tasks = useTaskStore((state) => state.tasks);
  const createTask = useTaskStore((state) => state.createTask);
  const updateTask = useTaskStore((state) => state.updateTask);
  const toggleTask = useTaskStore((state) => state.toggleTask);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const weekStartsOn = useSettingsStore((state) => state.settings?.weekStartsOn ?? 1);
  const today = todayString();

  const [status, setStatus] = useState<StatusFilter>("open");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [pending, setPending] = useState(false);

  const filtered = useMemo(() => {
    if (status === "all") return tasks;
    return tasks.filter((task) => task.status === status);
  }, [tasks, status]);

  const openCount = tasks.filter((task) => task.status === "open").length;
  const doneCount = tasks.filter((task) => task.status === "done").length;

  async function handleCreate(values: TaskFormValues) {
    try {
      await createTask(toCreateTaskInput(values));
      toast.success(t("tasks.added"));
      setCreateOpen(false);
    } catch {
      toast.error(t("tasks.createFailed"));
    }
  }

  async function handleUpdate(values: TaskFormValues) {
    if (!editing) return;
    try {
      await updateTask(editing.id, toCreateTaskInput(values));
      toast.success(t("tasks.updated"));
      setEditing(null);
    } catch {
      toast.error(t("tasks.updateFailed"));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("tasks.title")}
        description={t("tasks.description")}
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            {t("tasks.newTask")}
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <SelectMenu
          value={status}
          onChange={(next) => setStatus(next as StatusFilter)}
          aria-label={t("tasks.title")}
          options={[
            { value: "open", label: `${t("tasks.open")} (${openCount})` },
            { value: "done", label: `${t("tasks.done")} (${doneCount})` },
            { value: "all", label: `${t("tasks.all")} (${tasks.length})` },
          ]}
        />
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={<ListTodo className="h-5 w-5" />}
          title={t("tasks.emptyTitle")}
          description={t("tasks.emptyDescription")}
          actionLabel={t("tasks.create")}
          onAction={() => setCreateOpen(true)}
        />
      ) : filtered.length === 0 ? (
        <Card className="p-6 text-sm text-muted">{t("tasks.noMatch")}</Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              today={today}
              onToggle={() => {
                void toggleTask(task.id).catch(() => {
                  toast.error(t("tasks.updateStatusFailed"));
                });
              }}
              onEdit={() => setEditing(task)}
              onDelete={() => setDeleting(task)}
            />
          ))}
        </div>
      )}

      <Dialog
        open={createOpen}
        title={t("tasks.newTask")}
        description={t("tasks.newHint")}
        onClose={() => setCreateOpen(false)}
      >
        <TaskForm
          defaultValues={defaultTaskFormValues(today)}
          weekStartsOn={weekStartsOn}
          submitLabel={t("tasks.addTask")}
          onCancel={() => setCreateOpen(false)}
          onSubmit={handleCreate}
        />
      </Dialog>

      <Dialog
        open={editing !== null}
        title={t("tasks.editTitle")}
        description={t("tasks.editHint")}
        onClose={() => setEditing(null)}
      >
        {editing ? (
          <TaskForm
            defaultValues={taskToFormValues(editing)}
            weekStartsOn={weekStartsOn}
            submitLabel={t("tasks.saveChanges")}
            onCancel={() => setEditing(null)}
            onSubmit={handleUpdate}
          />
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        title={t("tasks.deleteTitle")}
        description={t("tasks.deleteHint")}
        confirmLabel={t("tasks.deleteConfirm")}
        danger
        pending={pending}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          setPending(true);
          void (async () => {
            try {
              await deleteTask(deleting.id);
              toast.success(t("tasks.deleted"));
              setDeleting(null);
            } catch {
              toast.error(t("tasks.deleteFailed"));
            } finally {
              setPending(false);
            }
          })();
        }}
      />
    </div>
  );
}
