"use client";

import { create } from "zustand";
import { checkInRepository } from "@/db/repositories/checkin.repository";
import { habitRepository } from "@/db/repositories/habit.repository";
import { workspaceRepository } from "@/db/repositories/workspace.repository";
import { todayString } from "@/lib/dates";
import type {
  CheckIn,
  CreateHabitInput,
  ExportPayload,
  Habit,
  LoadStatus,
  UpdateHabitInput,
} from "@/types";

interface HabitState {
  status: LoadStatus;
  error: string | null;
  habits: Habit[];
  checkIns: CheckIn[];
  load: () => Promise<void>;
  hydrate: (habits: Habit[], checkIns: CheckIn[]) => void;
  reset: () => void;
  createHabit: (input: CreateHabitInput) => Promise<Habit>;
  updateHabit: (id: string, patch: UpdateHabitInput) => Promise<void>;
  archiveHabit: (id: string) => Promise<void>;
  restoreHabit: (id: string) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  reorderHabits: (orderedIds: string[]) => Promise<void>;
  toggleCheckIn: (habitId: string, date?: string) => Promise<void>;
  seedDemo: () => Promise<void>;
  replaceAll: (payload: Pick<ExportPayload, "habits" | "checkIns">) => Promise<void>;
  clearAll: () => Promise<void>;
}

export const useHabitStore = create<HabitState>((set, get) => ({
  status: "idle",
  error: null,
  habits: [],
  checkIns: [],

  hydrate: (habits, checkIns) => {
    set({
      habits: [...habits].sort((a, b) => a.sortOrder - b.sortOrder),
      checkIns,
      status: "ready",
      error: null,
    });
  },

  reset: () => {
    set({ habits: [], checkIns: [], status: "idle", error: null });
  },

  load: async () => {
    if (get().status === "loading") return;
    set({ status: "loading", error: null });
    try {
      const [habits, checkIns] = await Promise.all([
        habitRepository.list(),
        checkInRepository.list(),
      ]);
      set({
        habits,
        checkIns,
        status: "ready",
        error: null,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not load habits.";
      set({ status: "error", error: message });
    }
  },

  createHabit: async (input) => {
    const habit = await habitRepository.create(input, get().habits.length);
    set({ habits: [...get().habits, habit] });
    return habit;
  },

  updateHabit: async (id, patch) => {
    const habit = await habitRepository.update(id, patch);
    set({
      habits: get().habits.map((item) => (item.id === id ? habit : item)),
    });
  },

  archiveHabit: async (id) => {
    await get().updateHabit(id, { archived: true });
  },

  restoreHabit: async (id) => {
    await get().updateHabit(id, { archived: false });
  },

  deleteHabit: async (id) => {
    await habitRepository.remove(id);
    await checkInRepository.removeByHabit(id);
    set({
      habits: get().habits.filter((habit) => habit.id !== id),
      checkIns: get().checkIns.filter((checkIn) => checkIn.habitId !== id),
    });
  },

  reorderHabits: async (orderedIds) => {
    const current = get().habits;
    const byId = new Map(current.map((habit) => [habit.id, habit]));
    const reordered = orderedIds
      .map((id, index) => {
        const habit = byId.get(id);
        if (!habit) return null;
        return { ...habit, sortOrder: index };
      })
      .filter((habit): habit is Habit => habit !== null);
    const remaining = current.filter((habit) => !orderedIds.includes(habit.id));
    const next = [...reordered, ...remaining];
    set({ habits: next });
    try {
      await habitRepository.reorder(orderedIds);
    } catch (error) {
      await get().load();
      throw error;
    }
  },

  toggleCheckIn: async (habitId, date = todayString()) => {
    const checkIns = await checkInRepository.toggle(habitId, date);
    set({ checkIns });
  },

  seedDemo: async () => {
    if (get().habits.length > 0) {
      throw new Error("Demo data is only available on an empty workspace.");
    }
    const data = await workspaceRepository.seedDemo();
    set({ habits: data.habits, checkIns: data.checkIns });
  },

  replaceAll: async ({ habits, checkIns }) => {
    set({
      habits: [...habits].sort((a, b) => a.sortOrder - b.sortOrder),
      checkIns,
    });
  },

  clearAll: async () => {
    set({ habits: [], checkIns: [] });
  },
}));
