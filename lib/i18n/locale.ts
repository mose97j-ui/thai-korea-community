import { isOperatorUser } from "@/lib/auth/operator";
import type { User } from "@/lib/auth/types";
import type { Locale } from "./types";

export const UI_LOCALE_KEY = "tkc_ui_locale";

export function readStoredUiLocale(): Locale | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = localStorage.getItem(UI_LOCALE_KEY);
  return stored === "ko" || stored === "th" ? stored : null;
}

export function persistUiLocale(locale: Locale): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(UI_LOCALE_KEY, locale);
}

export function resolveAppLocale(user: User | null | undefined): Locale {
  if (isOperatorUser(user)) {
    return "ko";
  }

  if (readStoredUiLocale() === "ko") {
    return "ko";
  }

  return "th";
}

export function syncUiLocaleForUser(user: User | null | undefined): Locale {
  const locale = resolveAppLocale(user);

  if (typeof window !== "undefined") {
    if (user && isOperatorUser(user)) {
      persistUiLocale("ko");
    } else if (user) {
      persistUiLocale("th");
    }
  }

  return locale;
}

export function persistUiLocaleOnLogout(user: User | null | undefined): void {
  if (!isOperatorUser(user)) {
    persistUiLocale("th");
  }
}
