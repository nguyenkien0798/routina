"use client";

import { create } from "zustand";
import { taskRepository } from "@/db/repositories/task.repository";
import type {
  CreateTaskInput,
  LoadStatus,
  Task,
  UpdateTaskInput,
} from "@/types";

interface TaskState {
  status: LoadStatus;
  error: string | null;
  tasks: Task[];
  load: () => Promise<void>;
  hydrate: (tasks: Task[]) => void;
  reset: () => void;
  createTask: (input: CreateTaskInput) => Promise<Task>;
  updateTask: (id: string, patch: UpdateTaskInput) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  replaceAll: (tasks: Task[]) => Promise<void>;
  clearAll: () => Promise<void>;
}

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.status !== b.status) return a.status === "open" ? -1 : 1;
    const aDue = `${a.dueDate}T${a.dueTime ?? "18:00"}`;
    const bDue = `${b.dueDate}T${b.dueTime ?? "18:00"}`;
    if (aDue !== bDue) return aDue.localeCompare(bDue);
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export const useTaskStore = create<TaskState>((set, get) => ({
  status: "idle",
  error: null,
  tasks: [],

  hydrate: (tasks) => {
    set({ tasks: sortTasks(tasks), status: "ready", error: null });
  },

  reset: () => {
    set({ tasks: [], status: "idle", error: null });
  },

  load: async () => {
    if (get().status === "loading") return;
    set({ status: "loading", error: null });
    try {
      const tasks = await taskRepository.list();
      set({ tasks: sortTasks(tasks), status: "ready", error: null });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not load tasks.";
      set({ status: "error", error: message });
    }
  },

  createTask: async (input) => {
    const task = await taskRepository.create(input);
    set({ tasks: sortTasks([...get().tasks, task]) });
    return task;
  },

  updateTask: async (id, patch) => {
    const task = await taskRepository.update(id, patch);
    set({
      tasks: sortTasks(
        get().tasks.map((item) => (item.id === id ? task : item)),
      ),
    });
  },

  toggleTask: async (id) => {
    const current = get().tasks.find((task) => task.id === id);
    if (!current) return;
    const nextStatus = current.status === "open" ? "done" : "open";
    const patch: UpdateTaskInput = {
      status: nextStatus,
      completedAt: nextStatus === "done" ? new Date().toISOString() : null,
    };
    await get().updateTask(id, patch);
  },

  deleteTask: async (id) => {
    await taskRepository.remove(id);
    set({ tasks: get().tasks.filter((task) => task.id !== id) });
  },

  replaceAll: async (tasks) => {
    set({ tasks: sortTasks(tasks) });
  },

  clearAll: async () => {
    set({ tasks: [] });
  },
}));
