"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_LOCALE,
  getDictionary,
  normalizeLocale,
  readStoredLocale,
  translate,
  writeStoredLocale,
} from "@/i18n";
import { useSettingsStore } from "@/stores/settings.store";
import type { AppLocale } from "@/types";

export function useI18n() {
  const settingsLocale = useSettingsStore((state) => state.settings?.locale);
  const setSettingsLocale = useSettingsStore((state) => state.setLocale);
  const [guestLocale, setGuestLocale] = useState<AppLocale>(DEFAULT_LOCALE);

  useEffect(() => {
    setGuestLocale(readStoredLocale());
  }, []);

  const locale: AppLocale = normalizeLocale(
    settingsLocale ?? guestLocale ?? DEFAULT_LOCALE,
  );
  const dictionary = useMemo(() => getDictionary(locale), [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) =>
      translate(locale, key, params),
    [locale],
  );

  const setLocale = useCallback(
    async (next: AppLocale) => {
      writeStoredLocale(next);
      setGuestLocale(next);
      document.documentElement.lang = next;
      await setSettingsLocale(next);
    },
    [setSettingsLocale],
  );

  return { locale, dictionary, t, setLocale };
}
