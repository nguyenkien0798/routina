import type { Metadata } from "next";
import Script from "next/script";
import { Syne, DM_Sans, JetBrains_Mono } from "next/font/google";
import { AppShell } from "@/components/layout/app-shell";
import { Providers } from "@/components/layout/providers";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import "./globals.css";

const syne = Syne({
  variable: "--font-display-family",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-sans-family",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono-family",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s · ${APP_NAME}`,
  },
  description: `${APP_TAGLINE} A personal habit tracker that stays on this device.`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body
        className="min-h-full bg-background font-sans text-foreground"
        suppressHydrationWarning
      >
        <Script
          id="routina-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
