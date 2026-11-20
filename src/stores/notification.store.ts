"use client";

import { create } from "zustand";
import { notificationRepository } from "@/db/repositories/notification.repository";

interface NotificationUiState {
  hydrated: boolean;
  readIds: Set<string>;
  browserShownIds: Set<string>;
  hydrate: () => Promise<void>;
  markRead: (ids: string[]) => Promise<void>;
  markAllRead: (ids: string[]) => Promise<void>;
  markBrowserShown: (ids: string[]) => Promise<void>;
  clearRead: () => Promise<void>;
  reset: () => void;
}

export const useNotificationStore = create<NotificationUiState>((set, get) => ({
  hydrated: false,
  readIds: new Set(),
  browserShownIds: new Set(),

  hydrate: async () => {
    if (typeof window === "undefined") return;
    try {
      const day = await notificationRepository.getToday();
      set({
        hydrated: true,
        readIds: new Set(day?.readIds ?? []),
        browserShownIds: new Set(day?.browserShownIds ?? []),
      });
    } catch {
      set({
        hydrated: true,
        readIds: new Set(),
        browserShownIds: new Set(),
      });
    }
  },

  markRead: async (ids) => {
    if (ids.length === 0) return;
    const next = new Set(get().readIds);
    for (const id of ids) next.add(id);
    set({ readIds: next });
    await notificationRepository.saveToday({ readIds: [...next] });
  },

  markAllRead: async (ids) => {
    await get().markRead(ids);
  },

  markBrowserShown: async (ids) => {
    if (ids.length === 0) return;
    const next = new Set(get().browserShownIds);
    for (const id of ids) next.add(id);
    set({ browserShownIds: next });
    await notificationRepository.saveToday({ browserShownIds: [...next] });
  },

  clearRead: async () => {
    set({ readIds: new Set() });
    await notificationRepository.saveToday({ readIds: [] });
  },

  reset: () => {
    set({
      hydrated: false,
      readIds: new Set(),
      browserShownIds: new Set(),
    });
  },
}));
