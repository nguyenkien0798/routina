import { getDb, type StoredHabit } from "@/db/database";
import { requireCurrentUserId } from "@/db/session";
import { createId } from "@/lib/id";
import type { CreateHabitInput, Habit, UpdateHabitInput } from "@/types";

function stripUserId(habit: StoredHabit): Habit {
  const { userId: _userId, ...rest } = habit;
  return rest;
}

export const habitRepository = {
  async list(userId?: string): Promise<Habit[]> {
    const uid = userId ?? (await requireCurrentUserId());
    const habits = await getDb().habits.where("userId").equals(uid).toArray();
    return habits.map(stripUserId).sort((a, b) => a.sortOrder - b.sortOrder);
  },

  async getById(id: string, userId?: string): Promise<Habit | undefined> {
    const uid = userId ?? (await requireCurrentUserId());
    const habit = await getDb().habits.get(id);
    if (!habit || habit.userId !== uid) return undefined;
    return stripUserId(habit);
  },

  async create(input: CreateHabitInput, sortOrder: number): Promise<Habit> {
    const userId = await requireCurrentUserId();
    const now = new Date().toISOString();
    const habit: StoredHabit = {
      id: createId(),
      userId,
      name: input.name.trim(),
      description: input.description.trim(),
      icon: input.icon,
      color: input.color,
      category: input.category,
      frequency: input.frequency,
      startDate: input.startDate,
      target: input.target,
      archived: false,
      sortOrder,
      createdAt: now,
      updatedAt: now,
    };
    await getDb().habits.add(habit);
    return stripUserId(habit);
  },

  async update(id: string, patch: UpdateHabitInput): Promise<Habit> {
    const userId = await requireCurrentUserId();
    const existing = await getDb().habits.get(id);
    if (!existing || existing.userId !== userId) {
      throw new Error("Habit not found.");
    }
    const next: StoredHabit = {
      ...existing,
      ...patch,
      userId,
      updatedAt: new Date().toISOString(),
    };
    await getDb().habits.put(next);
    return stripUserId(next);
  },

  async remove(id: string): Promise<void> {
    const userId = await requireCurrentUserId();
    const existing = await getDb().habits.get(id);
    if (!existing || existing.userId !== userId) {
      throw new Error("Habit not found.");
    }
    await getDb().habits.delete(id);
  },

  async reorder(orderedIds: string[]): Promise<void> {
    const userId = await requireCurrentUserId();
    const now = new Date().toISOString();
    await getDb().transaction("rw", getDb().habits, async () => {
      await Promise.all(
        orderedIds.map(async (id, index) => {
          const existing = await getDb().habits.get(id);
          if (!existing || existing.userId !== userId) return;
          await getDb().habits.update(id, { sortOrder: index, updatedAt: now });
        }),
      );
    });
  },

  async replaceForUser(userId: string, habits: Habit[]): Promise<void> {
    const stored: StoredHabit[] = habits.map((habit) => ({
      ...habit,
      userId,
    }));
    await getDb().transaction("rw", getDb().habits, async () => {
      await getDb().habits.where("userId").equals(userId).delete();
      if (stored.length > 0) {
        await getDb().habits.bulkAdd(stored);
      }
    });
  },

  async clearForUser(userId: string): Promise<void> {
    await getDb().habits.where("userId").equals(userId).delete();
  },
};
