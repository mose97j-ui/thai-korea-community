"use client";

import { useLocale } from "@/contexts/LocaleContext";
import {
  getActiveRestriction,
  type RestrictionScope,
} from "@/lib/auth/moderation";
import type { User } from "@/lib/auth/types";
import type { MessageKey } from "@/lib/i18n/messages";

type ModerationNoticeProps = {
  user: User;
  className?: string;
};

function formatUntil(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString(locale === "ko" ? "ko-KR" : "th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function scopeMessageKey(scope: RestrictionScope): MessageKey {
  switch (scope) {
    case "write":
      return "moderation.noticeWrite";
    case "comment":
      return "moderation.noticeComment";
    case "message":
      return "moderation.noticeMessage";
    case "activity":
      return "moderation.noticeActivity";
    case "permanent":
      return "moderation.noticePermanent";
    default:
      return "moderation.noticeActivity";
  }
}

export default function ModerationNotice({
  user,
  className = "",
}: ModerationNoticeProps) {
  const { t, locale } = useLocale();
  const restriction = getActiveRestriction(user);

  if (!restriction) {
    return null;
  }

  const untilLabel = restriction.until
    ? t("moderation.until").replace("{date}", formatUntil(restriction.until, locale))
    : t("moderation.permanent");

  return (
    <div
      className={`rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-rose-900 ring-1 ring-rose-100 ${className}`}
    >
      <p className="text-base font-bold">{t("moderation.restrictedTitle")}</p>
      <p className="mt-2 text-sm leading-relaxed">
        {t(scopeMessageKey(restriction.scope))}
      </p>
      <p className="mt-2 text-sm font-semibold">{untilLabel}</p>
      {restriction.reason ? (
        <p className="mt-2 text-sm text-rose-800/90">
          {t("moderation.reason")}: {restriction.reason}
        </p>
      ) : null}
    </div>
  );
}

export function getModerationBlockMessage(
  user: User | null | undefined,
  action: "write" | "comment" | "message"
): string | null {
  const restriction = getActiveRestriction(user);
  if (!restriction) {
    return null;
  }

  const blocked =
    restriction.scope === "permanent" ||
    restriction.scope === "activity" ||
    (action === "write" && restriction.scope === "write") ||
    (action === "comment" && restriction.scope === "comment") ||
    (action === "message" && restriction.scope === "message");

  if (!blocked) {
    return null;
  }

  return restriction.reason
    ? `${restriction.reason}`
    : restriction.scope;
}
