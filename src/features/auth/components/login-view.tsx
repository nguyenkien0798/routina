"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Leaf } from "lucide-react";
import { AppBackdrop } from "@/components/layout/app-backdrop";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import {
  clearLegacyLocalData,
  readLegacyLocalPayload,
} from "@/lib/local-legacy";
import {
  loginFormSchema,
  registerFormSchema,
  type LoginFormValues,
  type RegisterFormValues,
} from "@/features/auth/schemas/auth.schema";
import { useAuthStore } from "@/stores/auth.store";
import { useI18n } from "@/i18n/use-i18n";
import { cn } from "@/lib/cn";
import type { AppLocale, ExportPayload } from "@/types";

type Mode = "login" | "register";

export function LoginView() {
  const router = useRouter();
  const { t, locale, setLocale } = useI18n();
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const [mode, setMode] = useState<Mode>("login");
  const [legacyPayload, setLegacyPayload] = useState<ExportPayload | null>(null);
  const [importLegacy, setImportLegacy] = useState(true);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { username: "", password: "" },
    mode: "onBlur",
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { username: "", password: "", confirmPassword: "" },
    mode: "onBlur",
  });

  useEffect(() => {
    void readLegacyLocalPayload().then((payload) => {
      setLegacyPayload(payload);
      setImportLegacy(Boolean(payload));
    });
  }, []);

  function switchMode(next: Mode) {
    setMode(next);
    loginForm.clearErrors();
    registerForm.clearErrors();
  }

  async function onLogin(values: LoginFormValues) {
    try {
      await login(values.username, values.password);
      toast.success(t("auth.welcomeBack"));
      router.replace("/");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("auth.couldNotSignIn"),
      );
    }
  }

  async function onRegister(values: RegisterFormValues) {
    try {
      await register(
        values.username,
        values.password,
        importLegacy && legacyPayload ? legacyPayload : undefined,
      );
      if (importLegacy && legacyPayload) {
        await clearLegacyLocalData();
        toast.success(t("auth.accountCreatedImported"));
      } else {
        toast.success(t("auth.accountCreated"));
      }
      router.replace("/");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("auth.couldNotCreate"),
      );
    }
  }

  const pending =
    loginForm.formState.isSubmitting || registerForm.formState.isSubmitting;

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10">
      <AppBackdrop intensity="soft" />

      <div className="w-full max-w-md">
        <div className="mb-5 flex justify-center gap-1 rounded-[14px] border border-border bg-surface/80 p-1 shadow-[var(--shadow-xs)]">
          {(["en", "vi"] as const).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => void setLocale(code satisfies AppLocale)}
              className={cn(
                "h-8 min-w-[3rem] rounded-[11px] text-xs font-medium transition-colors",
                locale === code
                  ? "bg-primary text-primary-foreground"
                  : "text-muted hover:text-foreground",
              )}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[18px] bg-primary text-primary-foreground shadow-[var(--shadow-sm)]">
            <Leaf className="h-6 w-6" strokeWidth={2.2} />
          </div>
          <h1 className="font-display text-[2.35rem] font-bold tracking-[-0.045em]">
            {t("app.name")}
          </h1>
          <p className="mt-2 text-[15px] text-muted">{t("app.tagline")}</p>
        </div>

        <Card className="p-5 shadow-[var(--shadow-md)] sm:p-6">
          <div
            role="note"
            className="mb-5 rounded-[14px] border border-accent/20 bg-accent-soft px-3.5 py-3 text-[13px] leading-relaxed text-foreground"
          >
            <p className="font-medium tracking-[-0.01em]">
              {t("auth.deviceOnlyTitle")}
            </p>
            <p className="mt-1 text-muted">{t("auth.deviceOnlyBody")}</p>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-1 rounded-[14px] bg-background p-1">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`h-9 rounded-[11px] text-sm font-medium transition-colors ${
                mode === "login"
                  ? "bg-primary text-primary-foreground shadow-[var(--shadow-xs)]"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {t("auth.signIn")}
            </button>
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`h-9 rounded-[11px] text-sm font-medium transition-colors ${
                mode === "register"
                  ? "bg-primary text-primary-foreground shadow-[var(--shadow-xs)]"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {t("auth.createAccount")}
            </button>
          </div>

          {mode === "login" ? (
            <form
              className="space-y-4"
              onSubmit={loginForm.handleSubmit(onLogin)}
              noValidate
            >
              <Field
                label={t("auth.username")}
                htmlFor="login-username"
                error={loginForm.formState.errors.username?.message}
              >
                <Input
                  id="login-username"
                  autoComplete="username"
                  placeholder={t("auth.usernamePlaceholder")}
                  aria-invalid={Boolean(loginForm.formState.errors.username)}
                  {...loginForm.register("username")}
                />
              </Field>
              <Field
                label={t("auth.password")}
                htmlFor="login-password"
                error={loginForm.formState.errors.password?.message}
              >
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder={t("auth.yourPassword")}
                  aria-invalid={Boolean(loginForm.formState.errors.password)}
                  {...loginForm.register("password")}
                />
              </Field>
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? t("common.working") : t("auth.signIn")}
              </Button>
            </form>
          ) : (
            <form
              className="space-y-4"
              onSubmit={registerForm.handleSubmit(onRegister)}
              noValidate
            >
              <Field
                label={t("auth.username")}
                htmlFor="register-username"
                error={registerForm.formState.errors.username?.message}
              >
                <Input
                  id="register-username"
                  autoComplete="username"
                  placeholder={t("auth.usernamePlaceholder")}
                  aria-invalid={Boolean(registerForm.formState.errors.username)}
                  {...registerForm.register("username")}
                />
              </Field>
              <p className="-mt-2 text-[12px] text-muted">{t("auth.usernameHint")}</p>
              <Field
                label={t("auth.password")}
                htmlFor="register-password"
                error={registerForm.formState.errors.password?.message}
              >
                <Input
                  id="register-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder={t("auth.passwordPlaceholder")}
                  aria-invalid={Boolean(registerForm.formState.errors.password)}
                  {...registerForm.register("password")}
                />
              </Field>
              <Field
                label={t("auth.confirmPassword")}
                htmlFor="register-confirm"
                error={registerForm.formState.errors.confirmPassword?.message}
              >
                <Input
                  id="register-confirm"
                  type="password"
                  autoComplete="new-password"
                  placeholder={t("auth.confirmPlaceholder")}
                  aria-invalid={Boolean(
                    registerForm.formState.errors.confirmPassword,
                  )}
                  {...registerForm.register("confirmPassword")}
                />
              </Field>

              {legacyPayload ? (
                <label className="flex items-start gap-3 rounded-xl border border-border bg-background/70 px-3 py-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={importLegacy}
                    onChange={(event) => setImportLegacy(event.target.checked)}
                  />
                  <span>
                    <span className="font-medium tracking-[-0.01em]">
                      {t("auth.importLegacy")}
                    </span>
                    <span className="mt-0.5 block text-[12px] text-muted">
                      {t("auth.importLegacyHint", {
                        habits: legacyPayload.habits.length,
                        tasks: legacyPayload.tasks.length,
                      })}
                    </span>
                  </span>
                </label>
              ) : null}

              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? t("common.working") : t("auth.createAccount")}
              </Button>
            </form>
          )}
        </Card>

        <p className="mt-5 text-center text-[12px] leading-relaxed text-muted">
          {t("auth.footer")}
        </p>
      </div>
    </div>
  );
}