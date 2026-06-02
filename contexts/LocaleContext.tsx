"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { AuthErrorKey } from "@/lib/auth/errors";
import { messages, type MessageKey } from "@/lib/i18n/messages";
import { resolveAppLocale } from "@/lib/i18n/locale";
import { pickText } from "@/lib/i18n/pick";
import { localeRootClass } from "@/lib/i18n/typography";
import type { Locale, LocalizedText } from "@/lib/i18n/types";

type LocaleContextValue = {
  locale: Locale;
  t: (key: MessageKey) => string;
  te: (key: AuthErrorKey) => string;
  pick: (text: LocalizedText) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const { user, isReady } = useAuth();

  const locale: Locale = useMemo(() => {
    if (!isReady) {
      // Match SSR: do not read localStorage until auth is initialized.
      return "th";
    }
    return resolveAppLocale(user);
  }, [isReady, user]);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.classList.remove("locale-th", "locale-ko");
    root.classList.add(localeRootClass(locale));
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      t: (key: MessageKey) =>
        messages[locale][key] ?? messages.ko[key] ?? messages.th[key],
      te: (key: AuthErrorKey) =>
        messages[locale][`error.${key}` as MessageKey] ??
        messages.ko[`error.${key}` as MessageKey] ??
        messages.th[`error.${key}` as MessageKey],
      pick: (text: LocalizedText) => pickText(text, locale),
    }),
    [locale]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return context;
}
