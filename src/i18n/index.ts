import { en, type Dictionary } from "@/i18n/dictionaries/en";
import { vi } from "@/i18n/dictionaries/vi";
import type { AppLocale } from "@/types";

export const LOCALES: AppLocale[] = ["en", "vi"];
export const LOCALE_STORAGE_KEY = "routina-locale";
export const DEFAULT_LOCALE: AppLocale = "en";

const dictionaries: Record<AppLocale, Dictionary> = {
  en: en as Dictionary,
  vi: vi as Dictionary,
};

export function isAppLocale(value: unknown): value is AppLocale {
  return value === "en" || value === "vi";
}

export function normalizeLocale(value: unknown): AppLocale {
  return isAppLocale(value) ? value : DEFAULT_LOCALE;
}

export function getDictionary(locale: AppLocale): Dictionary {
  return dictionaries[normalizeLocale(locale)];
}

export function readStoredLocale(): AppLocale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    return normalizeLocale(localStorage.getItem(LOCALE_STORAGE_KEY));
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function writeStoredLocale(locale: AppLocale): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // ignore
  }
}

type NestedValue = string | { [key: string]: NestedValue };

function getPath(dict: Dictionary, path: string): string | undefined {
  const parts = path.split(".");
  let current: NestedValue = dict as unknown as NestedValue;
  for (const part of parts) {
    if (typeof current !== "object" || current === null || !(part in current)) {
      return undefined;
    }
    current = current[part];
  }
  return typeof current === "string" ? current : undefined;
}

export function translate(
  locale: AppLocale,
  key: string,
  params?: Record<string, string | number>,
): string {
  const template =
    getPath(getDictionary(locale), key) ??
    getPath(en, key) ??
    key;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    String(params[name] ?? `{${name}}`),
  );
}

export type { Dictionary };
