import { getDb } from "@/db/database";
import { getCurrentUserId } from "@/db/session";
import { todayString } from "@/lib/dates";
import type { NotificationDayState } from "@/types";

const LEGACY_READ_KEY = "routina.notifications.read";
const LEGACY_BROWSER_KEY = "routina.notifications.browser";

function dayId(userId: string, date: string): string {
  return `${userId}:${date}`;
}

function emptyDay(userId: string, date: string): NotificationDayState {
  return {
    id: dayId(userId, date),
    userId,
    date,
    readIds: [],
    browserShownIds: [],
    updatedAt: new Date().toISOString(),
  };
}

function readLegacyDaySet(key: string, today: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { date?: string; ids?: string[] };
    if (parsed.date !== today || !Array.isArray(parsed.ids)) return [];
    return parsed.ids;
  } catch {
    return [];
  }
}

function clearLegacyKeys() {
  try {
    localStorage.removeItem(LEGACY_READ_KEY);
    localStorage.removeItem(LEGACY_BROWSER_KEY);
  } catch {
    // ignore
  }
}

export const notificationRepository = {
  async getToday(userId?: string): Promise<NotificationDayState | null> {
    const uid = userId ?? (await getCurrentUserId());
    if (!uid) return null;
    const date = todayString();
    const existing = await getDb().notificationDays.get(dayId(uid, date));
    if (existing) return existing;

    // One-time migrate from localStorage (pre-IndexedDB noti marks).
    const legacyRead = readLegacyDaySet(LEGACY_READ_KEY, date);
    const legacyBrowser = readLegacyDaySet(LEGACY_BROWSER_KEY, date);
    if (legacyRead.length === 0 && legacyBrowser.length === 0) {
      return emptyDay(uid, date);
    }

    const migrated = {
      ...emptyDay(uid, date),
      readIds: legacyRead,
      browserShownIds: legacyBrowser,
    };
    await getDb().notificationDays.put(migrated);
    clearLegacyKeys();
    return migrated;
  },

  async saveToday(
    patch: Partial<Pick<NotificationDayState, "readIds" | "browserShownIds">>,
    userId?: string,
  ): Promise<NotificationDayState | null> {
    const uid = userId ?? (await getCurrentUserId());
    if (!uid) return null;
    const date = todayString();
    const current = (await this.getToday(uid)) ?? emptyDay(uid, date);
    const next: NotificationDayState = {
      ...current,
      id: dayId(uid, date),
      userId: uid,
      date,
      readIds: patch.readIds ?? current.readIds,
      browserShownIds: patch.browserShownIds ?? current.browserShownIds,
      updatedAt: new Date().toISOString(),
    };
    await getDb().notificationDays.put(next);
    return next;
  },

  async clearForUser(userId: string): Promise<void> {
    await getDb().notificationDays.where("userId").equals(userId).delete();
  },
};
