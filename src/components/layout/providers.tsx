"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Toaster } from "sonner";
import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { applyTheme } from "@/lib/theme";
import { workspaceRepository } from "@/db/repositories/workspace.repository";
import { useAuthStore } from "@/stores/auth.store";
import { useHabitStore } from "@/stores/habit.store";
import { useNotificationStore } from "@/stores/notification.store";
import { useSettingsStore } from "@/stores/settings.store";
import { useTaskStore } from "@/stores/task.store";
import { useI18n } from "@/i18n/use-i18n";

export function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = pathname === "/login";

  const authStatus = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const loadAuth = useAuthStore((state) => state.load);

  const hydrateHabits = useHabitStore((state) => state.hydrate);
  const resetHabits = useHabitStore((state) => state.reset);
  const habitStatus = useHabitStore((state) => state.status);
  const habitError = useHabitStore((state) => state.error);

  const hydrateTasks = useTaskStore((state) => state.hydrate);
  const resetTasks = useTaskStore((state) => state.reset);
  const taskStatus = useTaskStore((state) => state.status);
  const taskError = useTaskStore((state) => state.error);

  const hydrateSettings = useSettingsStore((state) => state.hydrate);
  const resetSettings = useSettingsStore((state) => state.reset);
  const settingsStatus = useSettingsStore((state) => state.status);
  const settingsError = useSettingsStore((state) => state.error);
  const theme = useSettingsStore((state) => state.settings?.theme ?? "system");

  const hydrateNotifications = useNotificationStore((state) => state.hydrate);
  const resetNotifications = useNotificationStore((state) => state.reset);

  useEffect(() => {
    void loadAuth();
  }, [loadAuth]);

  useEffect(() => {
    if (authStatus !== "ready") return;
    if (!user && !isAuthPage) {
      router.replace("/login");
      return;
    }
    if (user && isAuthPage) {
      router.replace("/");
    }
  }, [authStatus, user, isAuthPage, router]);

  useEffect(() => {
    if (!user) {
      resetHabits();
      resetTasks();
      resetSettings();
      resetNotifications();
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const data = await workspaceRepository.load(user.id);
        if (cancelled) return;
        hydrateHabits(data.habits, data.checkIns);
        hydrateTasks(data.tasks);
        hydrateSettings(data.settings);
        await hydrateNotifications();
      } catch (error) {
        if (cancelled) return;
        const message =
          error instanceof Error ? error.message : "Could not load your data.";
        useHabitStore.setState({ status: "error", error: message });
        useTaskStore.setState({ status: "error", error: message });
        useSettingsStore.setState({ status: "error", error: message });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    user,
    hydrateHabits,
    hydrateTasks,
    hydrateSettings,
    hydrateNotifications,
    resetHabits,
    resetTasks,
    resetSettings,
    resetNotifications,
  ]);

  useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  if (isAuthPage) {
    return (
      <>
        <Toaster theme="system" position="top-center" richColors closeButton />
        {children}
      </>
    );
  }

  if (authStatus !== "ready" || !user) {
    return (
      <>
        <Toaster theme="system" position="top-center" richColors closeButton />
        <AppSkeleton />
      </>
    );
  }

  const ready =
    habitStatus === "ready" &&
    taskStatus === "ready" &&
    settingsStatus === "ready";
  const error =
    habitStatus === "error" ||
    taskStatus === "error" ||
    settingsStatus === "error";

  return (
    <>
      <Toaster
        theme={theme === "system" ? "system" : theme}
        position="top-center"
        richColors
        closeButton
      />
      {error ? (
        <BootError
          message={
            habitError ?? taskError ?? settingsError ?? "Something went wrong."
          }
          onRetry={() => {
            void loadAuth();
          }}
        />
      ) : ready ? (
        children
      ) : (
        <AppSkeleton />
      )}
    </>
  );
}

function BootError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <div className="max-w-md rounded-2xl border border-border bg-surface p-8 text-center card-shadow">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/10 text-danger">
          <Leaf className="h-5 w-5" />
        </div>
        <h1 className="text-lg font-semibold">{t("boot.title")}</h1>
        <p className="mt-2 text-sm text-muted">
          {t("boot.hint", { message })}
        </p>
        <Button className="mt-5" onClick={onRetry}>
          {t("common.tryAgain")}
        </Button>
      </div>
    </div>
  );
}

function AppSkeleton() {
  return (
    <div className="min-h-dvh">
      <div className="px-3 pt-3 sm:px-5 sm:pt-4">
        <div className="mx-auto w-full max-w-6xl rounded-[28px] border border-border/70 bg-surface/70 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Skeleton className="h-9 w-40 rounded-xl" />
              <Skeleton className="mt-2 h-3 w-48" />
            </div>
            <Skeleton className="h-9 w-9 rounded-xl" />
          </div>
          <div className="mt-4 flex gap-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-9 w-20 rounded-[14px]" />
            ))}
          </div>
        </div>
      </div>
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-44 w-full rounded-[32px]" />
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-56 w-full rounded-[28px]" />
          <Skeleton className="h-56 w-full rounded-[28px]" />
        </div>
      </main>
    </div>
  );
}
