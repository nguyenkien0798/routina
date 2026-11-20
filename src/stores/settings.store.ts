"use client";

import { create } from "zustand";
import { settingsRepository } from "@/db/repositories/settings.repository";
import { normalizeLocale, writeStoredLocale } from "@/i18n";
import { applyTheme } from "@/lib/theme";
import type {
  AppLocale,
  AppSettings,
  LoadStatus,
  ThemePreference,
  WeekStartsOn,
} from "@/types";

interface SettingsState {
  status: LoadStatus;
  error: string | null;
  settings: AppSettings | null;
  load: () => Promise<void>;
  hydrate: (settings: AppSettings) => void;
  reset: () => void;
  setTheme: (theme: ThemePreference) => Promise<void>;
  setWeekStartsOn: (weekStartsOn: WeekStartsOn) => Promise<void>;
  setBrowserNotifications: (enabled: boolean) => Promise<void>;
  setLocale: (locale: AppLocale) => Promise<void>;
  replace: (settings: AppSettings) => Promise<void>;
  resetSettings: () => Promise<void>;
}

function withDefaults(settings: AppSettings): AppSettings {
  return {
    ...settings,
    id: "default",
    browserNotifications: settings.browserNotifications ?? false,
    locale: normalizeLocale(settings.locale),
  };
}

export const useSettingsStore = create<SettingsState>((set) => ({
  status: "idle",
  error: null,
  settings: null,

  hydrate: (settings) => {
    const next = withDefaults(settings);
    applyTheme(next.theme);
    writeStoredLocale(next.locale);
    if (typeof document !== "undefined") {
      document.documentElement.lang = next.locale;
    }
    set({
      settings: next,
      status: "ready",
      error: null,
    });
  },

  reset: () => {
    set({ settings: null, status: "idle", error: null });
  },

  load: async () => {
    set({ status: "loading", error: null });
    try {
      const settings = await settingsRepository.get();
      const next = withDefaults(settings);
      applyTheme(next.theme);
      writeStoredLocale(next.locale);
      if (typeof document !== "undefined") {
        document.documentElement.lang = next.locale;
      }
      set({ settings: next, status: "ready", error: null });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not load settings.";
      set({ status: "error", error: message });
    }
  },

  setTheme: async (theme) => {
    const settings = await settingsRepository.update({ theme });
    applyTheme(theme);
    set({ settings: withDefaults(settings) });
  },

  setWeekStartsOn: async (weekStartsOn) => {
    const settings = await settingsRepository.update({ weekStartsOn });
    set({ settings: withDefaults(settings) });
  },

  setBrowserNotifications: async (enabled) => {
    const settings = await settingsRepository.update({
      browserNotifications: enabled,
    });
    set({ settings: withDefaults(settings) });
  },

  setLocale: async (locale) => {
    writeStoredLocale(locale);
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
    const current = useSettingsStore.getState().settings;
    if (!current) return;
    const settings = await settingsRepository.update({ locale });
    set({ settings: withDefaults(settings) });
  },

  replace: async (settings) => {
    const next = withDefaults(settings);
    applyTheme(next.theme);
    writeStoredLocale(next.locale);
    if (typeof document !== "undefined") {
      document.documentElement.lang = next.locale;
    }
    set({ settings: next });
  },

  resetSettings: async () => {
    const settings = await settingsRepository.reset();
    const next = withDefaults(settings);
    applyTheme(next.theme);
    writeStoredLocale(next.locale);
    set({ settings: next });
  },
}));
