import { getDb, type StoredCheckIn } from "@/db/database";
import { requireCurrentUserId } from "@/db/session";
import { createId } from "@/lib/id";
import type { CheckIn } from "@/types";

function stripUserId(checkIn: StoredCheckIn): CheckIn {
  const { userId: _userId, ...rest } = checkIn;
  return rest;
}

export const checkInRepository = {
  async list(userId?: string): Promise<CheckIn[]> {
    const uid = userId ?? (await requireCurrentUserId());
    const rows = await getDb().checkIns.where("userId").equals(uid).toArray();
    return rows.map(stripUserId);
  },

  async getByHabitAndDate(
    habitId: string,
    date: string,
    userId?: string,
  ): Promise<CheckIn | undefined> {
    const uid = userId ?? (await requireCurrentUserId());
    const existing = await getDb()
      .checkIns.where("[userId+habitId+date]")
      .equals([uid, habitId, date])
      .first();
    return existing ? stripUserId(existing) : undefined;
  },

  async toggle(habitId: string, date: string): Promise<CheckIn[]> {
    const userId = await requireCurrentUserId();
    const existing = await getDb()
      .checkIns.where("[userId+habitId+date]")
      .equals([userId, habitId, date])
      .first();
    const now = new Date().toISOString();

    if (existing?.completed) {
      await getDb().checkIns.delete(existing.id);
    } else if (existing) {
      await getDb().checkIns.put({
        ...existing,
        completed: true,
        updatedAt: now,
      });
    } else {
      const created: StoredCheckIn = {
        id: createId(),
        userId,
        habitId,
        date,
        completed: true,
        createdAt: now,
        updatedAt: now,
      };
      await getDb().checkIns.add(created);
    }

    return this.list(userId);
  },

  async removeByHabit(habitId: string, userId?: string): Promise<void> {
    const uid = userId ?? (await requireCurrentUserId());
    await getDb()
      .checkIns.where("userId")
      .equals(uid)
      .filter((row) => row.habitId === habitId)
      .delete();
  },

  async replaceForUser(userId: string, checkIns: CheckIn[]): Promise<void> {
    const stored: StoredCheckIn[] = checkIns.map((checkIn) => ({
      ...checkIn,
      userId,
    }));
    await getDb().transaction("rw", getDb().checkIns, async () => {
      await getDb().checkIns.where("userId").equals(userId).delete();
      if (stored.length > 0) {
        await getDb().checkIns.bulkAdd(stored);
      }
    });
  },

  async clearForUser(userId: string): Promise<void> {
    await getDb().checkIns.where("userId").equals(userId).delete();
  },
};
