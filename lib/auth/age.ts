import type { Locale } from "@/lib/i18n/types";
import type { User } from "./types";

export function getUserBirthDate(user: User): string {
  if (user.birthDate) {
    return user.birthDate;
  }
  const year = new Date().getFullYear() - (user.age ?? 0);
  return `${year}-01-01`;
}

/** 만나이 (국제 나이) */
export function getInternationalAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);

  if (Number.isNaN(birth.getTime())) {
    return 0;
  }

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age;
}

export function formatAgeLabel(user: User, locale: Locale = "th"): string {
  const age = getInternationalAge(getUserBirthDate(user));
  return locale === "ko" ? `만 ${age}세` : `${age} ปี`;
}
