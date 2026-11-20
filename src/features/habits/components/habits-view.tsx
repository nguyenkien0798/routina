"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Archive, GripVertical, Pencil, Plus, RotateCcw, Search, Trash } from "lucide-react";
import { toast } from "sonner";
import { HabitGlyph } from "@/components/common/habit-icon";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { SelectMenu } from "@/components/ui/select-menu";
import { HABIT_CATEGORIES } from "@/lib/constants";
import { todayString } from "@/lib/dates";
import { describeFrequency } from "@/lib/frequency";
import { cn } from "@/lib/cn";
import { HabitForm } from "@/features/habits/components/habit-form";
import {
  defaultHabitFormValues,
  toCreateHabitInput,
  type HabitFormValues,
} from "@/features/habits/schemas/habit.schema";
import { useI18n } from "@/i18n/use-i18n";
import { useHabitStore } from "@/stores/habit.store";
import { useSettingsStore } from "@/stores/settings.store";
import { calculateHabitStatistics } from "@/utils/stats";
import { daysAgoString } from "@/lib/dates";
import type { Habit } from "@/types";

type StatusFilter = "active" | "archived" | "all";
type SortKey = "order" | "name" | "createdAt" | "completion";

export function HabitsView() {
  const { t } = useI18n();
  const habits = useHabitStore((state) => state.habits);
  const checkIns = useHabitStore((state) => state.checkIns);
  const createHabit = useHabitStore((state) => state.createHabit);
  const updateHabit = useHabitStore((state) => state.updateHabit);
  const archiveHabit = useHabitStore((state) => state.archiveHabit);
  const restoreHabit = useHabitStore((state) => state.restoreHabit);
  const deleteHabit = useHabitStore((state) => state.deleteHabit);
  const reorderHabits = useHabitStore((state) => state.reorderHabits);
  const weekStartsOn = useSettingsStore((state) => state.settings?.weekStartsOn ?? 1);
  const today = todayString();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("active");
  const [sort, setSort] = useState<SortKey>("order");
  const [editor, setEditor] = useState<null | { mode: "create" } | { mode: "edit"; habit: Habit }>(
    null,
  );
  const [pendingDelete, setPendingDelete] = useState<Habit | null>(null);

  const filtered = useMemo(() => {
    const from = daysAgoString(89, today);
    const stats = new Map(
      habits.map((habit) => [
        habit.id,
        calculateHabitStatistics(habit, checkIns, from, today, today, weekStartsOn),
      ]),
    );
    const list = habits.filter((habit) => {
      if (status === "active" && habit.archived) return false;
      if (status === "archived" && !habit.archived) return false;
      if (category !== "all" && habit.category !== category) return false;
      if (query.trim() && !habit.name.toLowerCase().includes(query.trim().toLowerCase())) {
        return false;
      }
      return true;
    });
    const sorted = [...list];
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "createdAt") sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (sort === "completion") {
      sorted.sort(
        (a, b) =>
          (stats.get(b.id)?.completionRate ?? 0) - (stats.get(a.id)?.completionRate ?? 0),
      );
    }
    if (sort === "order") sorted.sort((a, b) => a.sortOrder - b.sortOrder);
    return { list: sorted, stats };
  }, [habits, checkIns, query, category, status, sort, today, weekStartsOn]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const canDrag = sort === "order" && !query.trim() && category === "all" && status !== "all";

  async function handleDragEnd(event: DragEndEvent) {
    if (!canDrag) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = filtered.list.map((habit) => habit.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const nextVisible = arrayMove(ids, oldIndex, newIndex);
    const remaining = habits
      .filter((habit) => !nextVisible.includes(habit.id))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((habit) => habit.id);
    try {
      await reorderHabits([...nextVisible, ...remaining]);
    } catch {
      toast.error("Could not reorder habits.");
    }
  }

  async function handleSubmit(values: HabitFormValues) {
    const input = toCreateHabitInput(values);
    try {
      if (editor?.mode === "edit") {
        await updateHabit(editor.habit.id, input);
        toast.success("Habit updated.");
      } else {
        await createHabit(input);
        toast.success("Habit created.");
      }
      setEditor(null);
    } catch {
      toast.error("Could not save that habit.");
    }
  }

  const formDefaults =
    editor?.mode === "edit"
      ? habitToFormValues(editor.habit)
      : defaultHabitFormValues(today);

  return (
    <div>
      <PageHeader
        title={t("habits.title")}
        description={t("habits.description")}
        action={
          <Button onClick={() => setEditor({ mode: "create" })}>
            <Plus className="h-4 w-4" />
            {t("habits.newHabit")}
          </Button>
        }
      />

      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-muted" />
          <Input
            className="pl-9"
            placeholder="Search habits"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <SelectMenu
          value={category}
          onChange={setCategory}
          aria-label="Filter by category"
          options={[
            { value: "all", label: "All categories" },
            ...HABIT_CATEGORIES.map((item) => ({ value: item, label: item })),
          ]}
        />
        <SelectMenu
          value={status}
          onChange={(next) => setStatus(next as StatusFilter)}
          aria-label="Filter by status"
          options={[
            { value: "active", label: "Active" },
            { value: "archived", label: "Archived" },
            { value: "all", label: "All statuses" },
          ]}
        />
        <SelectMenu
          value={sort}
          onChange={(next) => setSort(next as SortKey)}
          aria-label="Sort habits"
          options={[
            { value: "order", label: "Custom order" },
            { value: "name", label: "Name" },
            { value: "createdAt", label: "Created date" },
            { value: "completion", label: "Completion rate" },
          ]}
        />
      </div>

      {filtered.list.length === 0 ? (
        <EmptyState
          icon={<Plus className="h-5 w-5" />}
          title={
            habits.length === 0 ? t("habits.emptyTitle") : t("habits.noMatchTitle")
          }
          description={
            habits.length === 0
              ? t("habits.emptyDescription")
              : t("habits.noMatchDescription")
          }
          actionLabel={habits.length === 0 ? t("habits.create") : undefined}
          onAction={habits.length === 0 ? () => setEditor({ mode: "create" }) : undefined}
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => void handleDragEnd(event)}>
          <SortableContext items={filtered.list.map((habit) => habit.id)} strategy={verticalListSortingStrategy}>
            <div className="stagger-children space-y-2.5">
              {filtered.list.map((habit) => (
                <SortableHabitCard
                  key={habit.id}
                  habit={habit}
                  canDrag={canDrag}
                  frequency={describeFrequency(habit.frequency, weekStartsOn)}
                  completion={filtered.stats.get(habit.id)?.completionRate ?? 0}
                  streak={filtered.stats.get(habit.id)?.currentStreak ?? 0}
                  onEdit={() => setEditor({ mode: "edit", habit })}
                  onArchive={() => {
                    void archiveHabit(habit.id);
                    toast.success("Habit archived.");
                  }}
                  onRestore={() => {
                    void restoreHabit(habit.id);
                    toast.success("Habit restored.");
                  }}
                  onDelete={() => setPendingDelete(habit)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Dialog
        open={editor !== null}
        title={editor?.mode === "edit" ? "Edit habit" : "New habit"}
        description="A clear name and a realistic schedule make follow-through easier."
        onClose={() => setEditor(null)}
      >
        {editor ? (
          <HabitForm
            key={editor.mode === "edit" ? editor.habit.id : "create"}
            defaultValues={formDefaults}
            weekStartsOn={weekStartsOn}
            submitLabel={editor.mode === "edit" ? "Save changes" : "Create habit"}
            onSubmit={handleSubmit}
            onCancel={() => setEditor(null)}
          />
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this habit?"
        description="This removes the habit and its check-in history from this device. This cannot be undone."
        confirmLabel="Delete habit"
        danger
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          void deleteHabit(pendingDelete.id)
            .then(() => toast.success("Habit deleted."))
            .catch(() => toast.error("Could not delete that habit."));
          setPendingDelete(null);
        }}
      />
    </div>
  );
}

function habitToFormValues(habit: Habit): HabitFormValues {
  return {
    name: habit.name,
    description: habit.description,
    icon: (habit.icon as HabitFormValues["icon"]) || "sparkles",
    color: (habit.color as HabitFormValues["color"]) || "#43865A",
    category: (habit.category as HabitFormValues["category"]) || "Other",
    frequencyType: habit.frequency.type,
    weekDays: habit.frequency.type === "weekly_days" ? habit.frequency.days : [1, 2, 3, 4, 5],
    timesPerWeek:
      habit.frequency.type === "weekly_target" ? habit.frequency.timesPerWeek : 3,
    startDate: habit.startDate,
    hasTarget: Boolean(habit.target),
    targetValue: habit.target?.value ?? null,
    targetUnit: habit.target?.unit ?? "",
  };
}

function SortableHabitCard({
  habit,
  canDrag,
  frequency,
  completion,
  streak,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}: {
  habit: Habit;
  canDrag: boolean;
  frequency: string;
  completion: number;
  streak: number;
  onEdit: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: habit.id,
    disabled: !canDrag,
  });

  return (
    <Card
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        backgroundImage: `linear-gradient(105deg, color-mix(in srgb, ${habit.color} 14%, transparent), transparent 46%)`,
      }}
      className={cn(
        "row-interactive relative overflow-hidden border-transparent p-4",
        isDragging && "opacity-70 shadow-[var(--shadow-md)]",
      )}
    >
      <span
        aria-hidden
        className="absolute inset-y-4 left-0 w-[3px] rounded-r-full"
        style={{ backgroundColor: habit.color }}
      />
      <div className="flex items-start gap-3 pl-1">
        <button
          type="button"
          className={cn(
            "mt-1.5 rounded-md p-0.5 text-muted transition-colors",
            canDrag
              ? "cursor-grab hover:bg-background hover:text-foreground active:cursor-grabbing"
              : "cursor-not-allowed opacity-30",
          )}
          aria-label="Reorder habit"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <HabitGlyph name={habit.icon} color={habit.color} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-[15px] font-medium tracking-[-0.015em]">
              {habit.name}
            </h2>
            <Badge
              className="border-transparent"
              style={{
                backgroundColor: `color-mix(in srgb, ${habit.color} 14%, transparent)`,
                color: habit.color,
              }}
            >
              {habit.category}
            </Badge>
            {habit.archived ? (
              <Badge className="border-warning/20 bg-warning/10 text-warning">
                Archived
              </Badge>
            ) : null}
          </div>
          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted">
            {frequency}
            {habit.target ? ` · ${habit.target.value} ${habit.target.unit}` : ""}
            {habit.description ? ` · ${habit.description}` : ""}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-border/70">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${completion}%`,
                  backgroundColor: habit.color,
                }}
              />
            </div>
            <p className="shrink-0 text-[12px] tabular-nums text-muted">
              {completion}% · {streak}{" "}
              {habit.frequency.type === "weekly_target" ? "wk" : "d"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-0.5">
          <Button variant="ghost" size="icon" aria-label="Edit" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          {habit.archived ? (
            <Button variant="ghost" size="icon" aria-label="Restore" onClick={onRestore}>
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" aria-label="Archive" onClick={onArchive}>
              <Archive className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" aria-label="Delete" onClick={onDelete}>
            <Trash className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
