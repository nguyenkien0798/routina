import { getDb, type StoredTask } from "@/db/database";
import { requireCurrentUserId } from "@/db/session";
import { createId } from "@/lib/id";
import { normalizeTaskTimes } from "@/lib/tasks";
import type { CreateTaskInput, Task, UpdateTaskInput } from "@/types";

function stripUserId(task: StoredTask): Task {
  const { userId: _userId, ...rest } = task;
  return normalizeTaskTimes(rest) as Task;
}

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.status !== b.status) return a.status === "open" ? -1 : 1;
    const aDue = `${a.dueDate}T${a.dueTime}`;
    const bDue = `${b.dueDate}T${b.dueTime}`;
    if (aDue !== bDue) return aDue.localeCompare(bDue);
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export const taskRepository = {
  async list(userId?: string): Promise<Task[]> {
    const uid = userId ?? (await requireCurrentUserId());
    const tasks = await getDb().tasks.where("userId").equals(uid).toArray();
    return sortTasks(tasks.map(stripUserId));
  },

  async create(input: CreateTaskInput): Promise<Task> {
    const userId = await requireCurrentUserId();
    const now = new Date().toISOString();
    const task: StoredTask = normalizeTaskTimes({
      id: createId(),
      userId,
      title: input.title.trim(),
      notes: input.notes.trim(),
      startDate: input.startDate,
      startTime: input.startTime,
      dueDate: input.dueDate,
      dueTime: input.dueTime,
      status: "open",
      priority: input.priority,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    }) as StoredTask;
    await getDb().tasks.add(task);
    return stripUserId(task);
  },

  async update(id: string, patch: UpdateTaskInput): Promise<Task> {
    const userId = await requireCurrentUserId();
    const existing = await getDb().tasks.get(id);
    if (!existing || existing.userId !== userId) {
      throw new Error("Task not found.");
    }
    const normalizedPatch =
      patch.startTime !== undefined || patch.dueTime !== undefined
        ? normalizeTaskTimes(patch)
        : patch;
    const next: StoredTask = {
      ...existing,
      ...normalizedPatch,
      userId,
      updatedAt: new Date().toISOString(),
    };
    await getDb().tasks.put(next);
    return stripUserId(next);
  },

  async remove(id: string): Promise<void> {
    const userId = await requireCurrentUserId();
    const existing = await getDb().tasks.get(id);
    if (!existing || existing.userId !== userId) {
      throw new Error("Task not found.");
    }
    await getDb().tasks.delete(id);
  },

  async replaceForUser(userId: string, tasks: Task[]): Promise<void> {
    const stored = tasks.map(
      (task) =>
        ({
          ...normalizeTaskTimes(task),
          userId,
        }) as StoredTask,
    );
    await getDb().transaction("rw", getDb().tasks, async () => {
      await getDb().tasks.where("userId").equals(userId).delete();
      if (stored.length > 0) {
        await getDb().tasks.bulkAdd(stored);
      }
    });
  },

  async clearForUser(userId: string): Promise<void> {
    await getDb().tasks.where("userId").equals(userId).delete();
  },
};
