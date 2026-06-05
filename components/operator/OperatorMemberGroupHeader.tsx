"use client";

import UserAvatar from "@/components/UserAvatar";
import { useLocale } from "@/contexts/LocaleContext";
import type { User } from "@/lib/auth/types";

type OperatorMemberGroupHeaderProps = {
  member: User;
  countLabel: string;
  unreadCount: number;
  compact?: boolean;
  expanded?: boolean;
  collapsible?: boolean;
  onToggle?: () => void;
};

export default function OperatorMemberGroupHeader({
  member,
  countLabel,
  unreadCount,
  compact = false,
  expanded = true,
  collapsible = false,
  onToggle,
}: OperatorMemberGroupHeaderProps) {
  const { t } = useLocale();
  const idLine = [member.personalCode, member.gmail].filter(Boolean).join(" · ");

  const inner = (
    <>
      <UserAvatar user={member} size="sm" shape="square" />
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-bold text-gray-900">
          {member.nickname || member.name}
        </p>
        <p className="truncate text-xs text-gray-500">
          {idLine || t("admin.inboxMemberIdFallback")}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="text-right">
          <p className="text-[10px] font-semibold text-gray-400">{countLabel}</p>
          <div className="mt-1 flex items-center justify-end gap-1.5">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${
                unreadCount > 0
                  ? "bg-red-50 text-red-700 ring-red-100"
                  : "bg-emerald-50 text-emerald-700 ring-emerald-100"
              }`}
            >
              {unreadCount > 0 ? t("common.unread") : t("common.read")}
            </span>
            {unreadCount > 0 ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </div>
        </div>
        {collapsible ? (
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full text-sm text-gray-500 ring-1 ring-black/[0.06]"
            aria-hidden
          >
            {expanded ? "▾" : "▸"}
          </span>
        ) : null}
      </div>
    </>
  );

  const className = `flex w-full items-center gap-3 bg-white ${
    compact ? "px-3 py-2.5" : "border-b border-black/[0.06] px-4 py-3"
  }`;

  if (collapsible && onToggle) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className={`${className} transition hover:bg-gray-50`}
        aria-expanded={expanded}
        aria-label={
          expanded ? t("support.collapseMemberGroup") : t("support.expandMemberGroup")
        }
      >
        {inner}
      </button>
    );
  }

  return <div className={className}>{inner}</div>;
}
