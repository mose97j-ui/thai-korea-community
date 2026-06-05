"use client";

import UserAvatar from "@/components/UserAvatar";
import { useLocale } from "@/contexts/LocaleContext";
import type { User } from "@/lib/auth/types";

type OperatorMemberGroupHeaderProps = {
  member: User;
  countLabel: string;
  unreadCount: number;
  compact?: boolean;
};

export default function OperatorMemberGroupHeader({
  member,
  countLabel,
  unreadCount,
  compact = false,
}: OperatorMemberGroupHeaderProps) {
  const { t } = useLocale();
  const idLine = [member.personalCode, member.gmail].filter(Boolean).join(" · ");

  return (
    <div
      className={`flex items-center gap-3 bg-white ${compact ? "px-3 py-2.5" : "border-b border-black/[0.06] px-4 py-3"}`}
    >
      <UserAvatar user={member} size="sm" shape="square" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-gray-900">
          {member.nickname || member.name}
        </p>
        <p className="truncate text-xs text-gray-500">
          {idLine || t("admin.inboxMemberIdFallback")}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[10px] font-semibold text-gray-400">{countLabel}</p>
        {unreadCount > 0 ? (
          <span className="mt-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </div>
    </div>
  );
}
