import { SETTINGS_ID } from "@/lib/constants";
import { getDb, type StoredSettings } from "@/db/database";
import { requireCurrentUserId } from "@/db/session";
import { normalizeLocale, readStoredLocale } from "@/i18n";
import type { AppSettings, ThemePreference, WeekStartsOn } from "@/types";

function toAppSettings(row: StoredSettings): AppSettings {
  return {
    id: SETTINGS_ID,
    theme: row.theme,
    weekStartsOn: row.weekStartsOn,
    browserNotifications: row.browserNotifications ?? false,
    locale: normalizeLocale(row.locale ?? readStoredLocale()),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function defaultStored(userId: string): StoredSettings {
  const now = new Date().toISOString();
  return {
    id: userId,
    theme: "system",
    weekStartsOn: 1,
    browserNotifications: false,
    locale: readStoredLocale(),
    createdAt: now,
    updatedAt: now,
  };
}

export const settingsRepository = {
  async ensure(userId: string): Promise<AppSettings> {
    const existing = await getDb().settings.get(userId);
    if (existing) return toAppSettings(existing);
    const created = defaultStored(userId);
    await getDb().settings.put(created);
    return toAppSettings(created);
  },

  async get(userId?: string): Promise<AppSettings> {
    const uid = userId ?? (await requireCurrentUserId());
    return this.ensure(uid);
  },

  async update(
    patch: Partial<
      Pick<
        AppSettings,
        "theme" | "weekStartsOn" | "browserNotifications" | "locale"
      >
    >,
  ): Promise<AppSettings> {
    const userId = await requireCurrentUserId();
    const current = await this.ensure(userId);
    const next: StoredSettings = {
      id: userId,
      theme: patch.theme ?? current.theme,
      weekStartsOn: patch.weekStartsOn ?? current.weekStartsOn,
      browserNotifications:
        patch.browserNotifications ?? current.browserNotifications,
      locale: normalizeLocale(patch.locale ?? current.locale),
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    };
    await getDb().settings.put(next);
    return toAppSettings(next);
  },

  async replace(userId: string, settings: AppSettings): Promise<AppSettings> {
    const next: StoredSettings = {
      id: userId,
      theme: settings.theme,
      weekStartsOn: settings.weekStartsOn,
      browserNotifications: settings.browserNotifications ?? false,
      locale: normalizeLocale(settings.locale),
      createdAt: settings.createdAt,
      updatedAt: new Date().toISOString(),
    };
    await getDb().settings.put(next);
    return toAppSettings(next);
  },

  async reset(): Promise<AppSettings> {
    const userId = await requireCurrentUserId();
    const created = defaultStored(userId);
    await getDb().settings.put(created);
    return toAppSettings(created);
  },
};

export type { ThemePreference, WeekStartsOn };
