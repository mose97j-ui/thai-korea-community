import type { Locale } from "./types";

/** Social feed title (post / page headline). */
export const readableTitleClass = "text-ui-title";

/** Body copy under titles. */
export const readableBodyClass = "text-ui-body";

/** Timestamps, hints, secondary lines. */
export const readableCaptionClass = "text-ui-caption";

/** Grid labels, chips, compact nav text. */
export const readableChipClass = "text-ui-chip";

/** Buttons with longer i18n labels. */
export const readableButtonClass = "text-ui-btn";

/** Large page hero titles. */
export const readableHeadlineClass = "text-ui-headline";

/** Site brand name (Thai Korea Community). */
export const siteNameClass = "text-site-name";

export function titleClampClass(lines: 2 | 3 = 2): string {
  return lines === 3 ? "line-clamp-3" : "line-clamp-2";
}

export function bodyClampClass(lines: 2 | 3 | 4 = 3): string {
  if (lines === 2) return "line-clamp-2";
  if (lines === 4) return "line-clamp-4";
  return "line-clamp-3";
}

export function localeRootClass(locale: Locale): string {
  return locale === "ko" ? "locale-ko" : "locale-th";
}
