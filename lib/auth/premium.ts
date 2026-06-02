import { hasOperatorPrivileges } from "@/lib/auth/operatorView";
import type { User } from "@/lib/auth/types";
import type { Locale } from "@/lib/i18n/types";

export const PREMIUM_PLAN_DAYS = 30;

export type PremiumStatus = "active" | "expired" | "none";

export function hasPremiumAccess(user: User | null | undefined): boolean {
  if (!user) {
    return false;
  }

  if (hasOperatorPrivileges(user)) {
    return true;
  }

  if (!user.premiumUntil) {
    return false;
  }

  return new Date(user.premiumUntil) > new Date();
}

export function getPremiumStatus(user: User | null | undefined): PremiumStatus {
  if (!user?.premiumUntil) {
    return "none";
  }

  return hasPremiumAccess(user) ? "active" : "expired";
}

export function getPremiumUntilDate(user: User | null | undefined): Date | null {
  if (!user?.premiumUntil) {
    return null;
  }

  const date = new Date(user.premiumUntil);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function extendPremiumUntil(user: User, days = PREMIUM_PLAN_DAYS): string {
  const now = new Date();
  const currentEnd = getPremiumUntilDate(user);
  const base =
    currentEnd && currentEnd.getTime() > now.getTime() ? currentEnd : now;
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next.toISOString();
}

export function formatPremiumUntil(
  user: User | null | undefined,
  locale: Locale
): string | null {
  const date = getPremiumUntilDate(user);
  if (!date) {
    return null;
  }

  return date.toLocaleDateString(locale === "ko" ? "ko-KR" : "th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
