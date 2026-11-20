"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf } from "lucide-react";
import { AppBackdrop } from "@/components/layout/app-backdrop";
import { NAV_ITEMS } from "@/components/layout/nav-config";
import { BrowserNotificationWatcher } from "@/features/notifications/components/browser-notification-watcher";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { useI18n } from "@/i18n/use-i18n";
import { cn } from "@/lib/cn";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t } = useI18n();

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="relative flex min-h-dvh flex-col">
      <BrowserNotificationWatcher />
      <AppBackdrop />

      <header className="relative z-30 border-b border-border/80 bg-[#3d7a5a] text-primary-foreground">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-45"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 0%, #d5ecc088 0, transparent 40%), radial-gradient(circle at 90% 20%, #8ec5cc66 0, transparent 35%), url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Cg fill='%23d5ecc0' fill-opacity='0.22'%3E%3Cpath d='M12 18c0 0-8-6-3-12s11-1 11-1-1 10-8 13z'/%3E%3Cpath d='M44 14c0 0 9-4 11 2s-4 10-4 10-9-2-7-12z'/%3E%3Cpath d='M30 42c0 0-10 4-8 11s11 3 11 3 1-11-3-14z'/%3E%3C/g%3E%3C/svg%3E\")",
            backgroundSize: "auto, auto, 64px 64px",
          }}
        />
        <div className="relative mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="group min-w-0">
            <span className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-lime text-lime-ink shadow-[var(--shadow-xs)] transition-transform duration-300 group-hover:-rotate-4 group-hover:scale-[1.03]">
                <Leaf className="h-5 w-5" strokeWidth={2.2} />
              </span>
              <span className="min-w-0">
                <span className="font-display block text-[1.85rem] leading-none font-bold tracking-[-0.045em] sm:text-[2.1rem]">
                  {t("app.name")}
                </span>
                <span className="mt-1 block text-[12px] text-white/75 sm:text-[13px]">
                  {t("app.tagline")}
                </span>
              </span>
            </span>
          </Link>
          <div className="rounded-[12px] bg-white/10 p-0.5 [&_button]:border-0 [&_button]:bg-transparent [&_button]:text-white [&_button]:shadow-none [&_button]:hover:bg-white/15">
            <NotificationBell />
          </div>
        </div>

        <nav aria-label="Primary" className="relative border-t border-white/15 bg-black/10">
          <div className="mx-auto w-full max-w-6xl overflow-x-auto px-3 py-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:px-5 lg:px-7 [&::-webkit-scrollbar]:hidden">
            <ul className="flex min-w-max gap-1">
              {NAV_ITEMS.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 rounded-[12px] px-3 py-2 text-[13px] font-semibold tracking-[-0.015em] transition-all duration-200 sm:text-[14px]",
                        active
                          ? "bg-lime text-lime-ink"
                          : "text-white/80 hover:bg-white/10 hover:text-white",
                      )}
                    >
                      <item.icon
                        className="h-3.5 w-3.5"
                        strokeWidth={active ? 2.2 : 1.9}
                      />
                      {t(item.labelKey)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      </header>

      <main className="animate-page-in relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {children}
      </main>
    </div>
  );
}
