"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Bell,
  Database,
  Download,
  Info,
  LogOut,
  Monitor,
  Moon,
  Sun,
  Upload,
  UserRound,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { APP_VERSION } from "@/lib/constants";
import { useI18n } from "@/i18n/use-i18n";
import { cn } from "@/lib/cn";
import { todayString } from "@/lib/dates";
import {
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
  type BrowserPermission,
} from "@/lib/browser-notifications";
import {
  backupFilename,
  buildExportPayload,
  downloadJson,
  parseImportPayload,
  serializeExport,
} from "@/utils/backup";
import { workspaceRepository } from "@/db/repositories/workspace.repository";
import { useAuthStore } from "@/stores/auth.store";
import { useHabitStore } from "@/stores/habit.store";
import { useSettingsStore } from "@/stores/settings.store";
import { useTaskStore } from "@/stores/task.store";
import type {
  AppSettings,
  CheckIn,
  ExportPayload,
  Habit,
  Task,
  ThemePreference,
  WeekStartsOn,
  AppLocale,
} from "@/types";

export function SettingsView() {
  const router = useRouter();
  const { t, locale, setLocale } = useI18n();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const habits = useHabitStore((state) => state.habits);
  const checkIns = useHabitStore((state) => state.checkIns);
  const hydrateHabits = useHabitStore((state) => state.hydrate);
  const tasks = useTaskStore((state) => state.tasks);
  const hydrateTasks = useTaskStore((state) => state.hydrate);
  const settings = useSettingsStore((state) => state.settings);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const setWeekStartsOn = useSettingsStore((state) => state.setWeekStartsOn);
  const setBrowserNotifications = useSettingsStore(
    (state) => state.setBrowserNotifications,
  );
  const hydrateSettings = useSettingsStore((state) => state.hydrate);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importPayload, setImportPayload] = useState<ExportPayload | null>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [permission, setPermission] = useState<BrowserPermission>("default");

  useEffect(() => {
    setPermission(getBrowserNotificationPermission());
  }, []);

  if (!settings) return null;
  const currentSettings = settings;

  function exportData() {
    const payload = buildExportPayload(habits, checkIns, currentSettings, tasks);
    downloadJson(backupFilename(todayString()), serializeExport(payload));
    toast.success(t("settings.backupDownloaded"));
  }

  async function onFile(file: File) {
    try {
      const raw = await file.text();
      const payload = parseImportPayload(raw);
      setImportPayload(payload);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("settings.readFileFailed"));
    }
  }

  async function applyBundle(data: {
    habits: Habit[];
    checkIns: CheckIn[];
    tasks: Task[];
    settings: AppSettings;
  }) {
    hydrateHabits(data.habits, data.checkIns);
    hydrateTasks(data.tasks);
    hydrateSettings(data.settings);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("settings.title")}
        description={t("settings.description")}
      />

      <Card className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <UserRound className="h-4 w-4" strokeWidth={1.9} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold tracking-[-0.015em]">
              {t("settings.account")}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              {t("settings.signedInAs")}{" "}
              <span className="font-medium text-foreground">
                {user?.username ?? "—"}
              </span>
              . {t("settings.accountHint")}
            </p>
            <Button
              className="mt-4"
              variant="secondary"
              onClick={() => {
                void (async () => {
                  await logout();
                  toast.success(t("settings.signedOut"));
                  router.replace("/login");
                })();
              }}
            >
              <LogOut className="h-4 w-4" />
              {t("settings.signOut")}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="text-[15px] font-semibold tracking-[-0.015em]">
          {t("settings.language")}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          {t("settings.languageHint")}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {(
            [
              ["en", "settings.english"],
              ["vi", "settings.vietnamese"],
            ] as const
          ).map(([value, labelKey]) => (
            <button
              key={value}
              type="button"
              onClick={() => void setLocale(value satisfies AppLocale)}
              className={cn(
                "h-11 rounded-xl border text-sm font-medium tracking-[-0.01em] transition-colors duration-150",
                locale === value
                  ? "border-primary/40 bg-primary-soft text-primary"
                  : "border-border text-muted hover:border-border-strong hover:text-foreground",
              )}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="text-[15px] font-semibold tracking-[-0.015em]">
          {t("settings.theme")}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          {t("settings.themeHint")}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {(
            [
              ["light", "settings.light", Sun],
              ["dark", "settings.dark", Moon],
              ["system", "settings.system", Monitor],
            ] as const
          ).map(([value, labelKey, Icon]) => (
            <button
              key={value}
              type="button"
              onClick={() => void setTheme(value satisfies ThemePreference)}
              className={cn(
                "flex h-[84px] flex-col items-center justify-center gap-2 rounded-2xl border text-sm font-medium tracking-[-0.01em] transition-colors duration-150",
                currentSettings.theme === value
                  ? "border-primary/40 bg-primary-soft text-primary"
                  : "border-border text-muted hover:border-border-strong hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.9} />
              {t(labelKey)}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <Bell className="h-4 w-4" strokeWidth={1.9} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold tracking-[-0.015em]">
              {t("settings.notifications")}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              {t("settings.notificationsHint")}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={currentSettings.browserNotifications}
                onClick={() => {
                  void (async () => {
                    if (currentSettings.browserNotifications) {
                      await setBrowserNotifications(false);
                      toast.success(t("settings.notificationsOff"));
                      return;
                    }
                    const next = await requestBrowserNotificationPermission();
                    setPermission(next);
                    if (next !== "granted") {
                      await setBrowserNotifications(false);
                      toast.error(
                        next === "unsupported"
                          ? t("settings.notificationsUnsupported")
                          : t("settings.notificationsDenied"),
                      );
                      return;
                    }
                    await setBrowserNotifications(true);
                    toast.success(t("settings.notificationsOn"));
                  })();
                }}
                className={cn(
                  "relative h-7 w-12 rounded-full transition-colors duration-150",
                  currentSettings.browserNotifications
                    ? "bg-primary"
                    : "bg-border",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-[var(--shadow-xs)] transition-transform duration-150",
                    currentSettings.browserNotifications && "translate-x-5",
                  )}
                />
              </button>
              <span className="text-sm text-muted">
                {permission === "unsupported"
                  ? t("settings.notSupported")
                  : permission === "denied"
                    ? t("settings.blocked")
                    : currentSettings.browserNotifications
                      ? t("settings.onWhileOpen")
                      : t("settings.off")}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="text-[15px] font-semibold tracking-[-0.015em]">
          {t("settings.weekStart")}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          {t("settings.weekStartHint")}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {(
            [
              [1, "settings.monday"],
              [0, "settings.sunday"],
              [6, "settings.saturday"],
            ] as const
          ).map(([value, labelKey]) => (
            <button
              key={value}
              type="button"
              onClick={() => void setWeekStartsOn(value satisfies WeekStartsOn)}
              className={cn(
                "h-11 rounded-xl border text-sm font-medium tracking-[-0.01em] transition-colors duration-150",
                currentSettings.weekStartsOn === value
                  ? "border-primary/40 bg-primary-soft text-primary"
                  : "border-border text-muted hover:border-border-strong hover:text-foreground",
              )}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="text-[15px] font-semibold tracking-[-0.015em]">
          {t("settings.data")}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          {t("settings.dataHint")}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={exportData}>
            <Download className="h-4 w-4" />
            {t("settings.export")}
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" />
            {t("settings.import")}
          </Button>
          <Button variant="danger" onClick={() => setClearOpen(true)}>
            {t("settings.clear")}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void onFile(file);
            }}
          />
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-background text-muted">
            <Database className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">{t("settings.storageTitle")}</h2>
            <p className="mt-1 text-sm text-muted">
              {t("settings.storageHint", {
                habits: habits.length,
                checkIns: checkIns.length,
                tasks: tasks.length,
                username: user?.username ?? "",
              })}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-background text-muted">
            <Info className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">{t("app.name")}</h2>
            <p className="mt-1 text-sm text-muted">
              {t("settings.aboutHint", {
                tagline: t("app.tagline"),
                version: APP_VERSION,
              })}
            </p>
          </div>
        </div>
      </Card>

      <Dialog
        open={importPayload !== null}
        title={t("settings.replaceTitle")}
        description={t("settings.replaceHint")}
        onClose={() => !pending && setImportPayload(null)}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" disabled={pending} onClick={() => setImportPayload(null)}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="secondary"
            disabled={pending}
            onClick={() =>
              downloadJson(
                backupFilename(todayString()),
                serializeExport(buildExportPayload(habits, checkIns, currentSettings, tasks)),
              )
            }
          >
            {t("settings.downloadCurrent")}
          </Button>
          <Button
            variant="danger"
            disabled={pending}
            onClick={() => {
              if (!importPayload) return;
              setPending(true);
              void (async () => {
                try {
                  if (!user) throw new Error("Not signed in.");
                  const data = await workspaceRepository.replace(
                    user.id,
                    importPayload,
                  );
                  await applyBundle(data);
                  toast.success(t("settings.restored"));
                  setImportPayload(null);
                } catch {
                  toast.error(t("settings.restoreFailed"));
                } finally {
                  setPending(false);
                }
              })();
            }}
          >
            {pending ? t("settings.restoring") : t("settings.restore")}
          </Button>
        </div>
      </Dialog>

      <ConfirmDialog
        open={clearOpen}
        title={t("settings.clearTitle")}
        description={t("settings.clearHint")}
        confirmLabel={t("settings.clearConfirm")}
        danger
        pending={pending}
        onClose={() => setClearOpen(false)}
        onConfirm={() => {
          setPending(true);
          void (async () => {
            try {
              downloadJson(
                backupFilename(todayString()),
                serializeExport(buildExportPayload(habits, checkIns, currentSettings, tasks)),
              );
              const data = await workspaceRepository.clear(user?.id);
              await applyBundle(data);
              toast.success(t("settings.cleared"));
              setClearOpen(false);
            } catch {
              toast.error(t("settings.clearFailed"));
            } finally {
              setPending(false);
            }
          })();
        }}
      />
    </div>
  );
}
