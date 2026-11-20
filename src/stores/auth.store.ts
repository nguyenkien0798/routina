"use client";

import { create } from "zustand";
import { authRepository } from "@/db/repositories/auth.repository";
import type { AuthUser, ExportPayload, LoadStatus } from "@/types";

export type { AuthUser };

interface AuthState {
  status: LoadStatus;
  user: AuthUser | null;
  error: string | null;
  load: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  register: (
    username: string,
    password: string,
    importPayload?: ExportPayload,
  ) => Promise<void>;
  logout: () => Promise<void>;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: "idle",
  user: null,
  error: null,

  load: async () => {
    set({ status: "loading", error: null });
    try {
      const user = await authRepository.getCurrentUser();
      set({ user, status: "ready", error: null });
    } catch (error) {
      set({
        user: null,
        status: "ready",
        error: error instanceof Error ? error.message : "Could not check session.",
      });
    }
  },

  login: async (username, password) => {
    const user = await authRepository.login(username, password);
    set({ user, status: "ready", error: null });
  },

  register: async (username, password, importPayload) => {
    const user = await authRepository.register(
      username,
      password,
      importPayload,
    );
    set({ user, status: "ready", error: null });
  },

  logout: async () => {
    await authRepository.logout();
    set({ user: null, status: "ready", error: null });
  },

  clear: () => set({ user: null, status: "ready", error: null }),
}));
