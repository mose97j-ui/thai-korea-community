"use client";

import { useCallback, useEffect, useState } from "react";
import OperatorMemberGroupHeader from "@/components/operator/OperatorMemberGroupHeader";
import { SectionLabel } from "@/components/ui";
import { useLocale } from "@/contexts/LocaleContext";
import { formatPostDate } from "@/lib/posts/format";
import type { SupportMemberGroup } from "@/lib/support/groupByMember";
import type { SupportRequest } from "@/lib/support/types";
import Link from "next/link";
import {
  supportCategoryIcon,
  supportCategoryLabelKey,
} from "@/lib/support/categoryDisplay";
import type { MessageKey } from "@/lib/i18n/messages";
import type { SupportStatus } from "@/lib/support/types";

function statusLabelKey(status: SupportStatus): MessageKey {
  switch (status) {
    case "open":
      return "support.statusOpen";
    case "answered":
      return "support.statusAnswered";
    default:
      return "support.statusClosed";
  }
}

function statusClassName(status: SupportStatus): string {
  switch (status) {
    case "open":
      return "bg-amber-100 text-amber-800 ring-amber-200";
    case "answered":
      return "bg-emerald-100 text-emerald-800 ring-emerald-200";
    default:
      return "bg-gray-100 text-gray-600 ring-gray-200";
  }
}

function GroupRequestRow({
  request,
  locale,
}: {
  request: SupportRequest;
  locale: "ko" | "th";
}) {
  const { t } = useLocale();
  const lastMessage = request.messages[request.messages.length - 1];

  return (
    <Link
      href={`/support/${request.id}`}
      className="flex items-start gap-3 rounded-xl bg-white px-3 py-3 ring-1 ring-black/[0.06] transition hover:ring-[#06C755]/30"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F0F2F5] text-base">
        {supportCategoryIcon(request.category)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${statusClassName(request.status)}`}
          >
            {t(statusLabelKey(request.status))}
          </span>
          <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700 ring-1 ring-sky-100">
            {t(supportCategoryLabelKey(request.category))}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${
              request.unreadByOperator
                ? "bg-red-50 text-red-700 ring-red-100"
                : "bg-emerald-50 text-emerald-700 ring-emerald-100"
            }`}
          >
            {request.unreadByOperator ? t("common.unread") : t("common.read")}
          </span>
          {request.unreadByOperator ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              1
            </span>
          ) : null}
        </span>
        <p className="mt-1 truncate text-sm font-bold text-gray-900">{request.title}</p>
        <p className="mt-0.5 line-clamp-1 text-xs text-gray-600">{lastMessage?.content}</p>
        <p className="mt-1 text-[10px] text-gray-400">
          {formatPostDate(request.updatedAt, locale)}
        </p>
      </span>
    </Link>
  );
}

function initialOpenIds(groups: SupportMemberGroup[]): Set<string> {
  return new Set(
    groups.filter((group) => group.unreadCount > 0).map((group) => group.userId)
  );
}

export default function SupportMemberGroupList({
  groups,
  locale,
}: {
  groups: SupportMemberGroup[];
  locale: "ko" | "th";
}) {
  const { t } = useLocale();
  const [openIds, setOpenIds] = useState<Set<string>>(() => initialOpenIds(groups));

  useEffect(() => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      for (const group of groups) {
        if (group.unreadCount > 0) {
          next.add(group.userId);
        }
      }
      return next;
    });
  }, [groups]);

  const toggleGroup = useCallback((userId: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setOpenIds(new Set(groups.map((group) => group.userId)));
  }, [groups]);

  const collapseAll = useCallback(() => {
    setOpenIds(new Set());
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionLabel>{t("admin.inboxGroupedByMember")}</SectionLabel>
        {groups.length > 1 ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={expandAll}
              className="text-xs font-semibold text-[#06C755] hover:underline"
            >
              {t("support.expandAllGroups")}
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="text-xs font-semibold text-gray-500 hover:underline"
            >
              {t("support.collapseAllGroups")}
            </button>
          </div>
        ) : null}
      </div>
      {groups.map((group) => {
        const expanded = openIds.has(group.userId);
        const memberUser = {
          id: group.userId,
          name: group.userNickname,
          nickname: group.userNickname,
          profileImage: group.userProfileImage,
          birthDate: "2000-01-01",
          hometown: "",
          gmail: group.userGmail,
          koreanPhone: "",
          personalCode: group.userPersonalCode,
          password: "",
          createdAt: group.latestUpdatedAt,
        };

        return (
          <section
            key={group.userId}
            className="overflow-hidden rounded-2xl bg-[#F0F2F5] ring-1 ring-black/[0.06]"
          >
            <OperatorMemberGroupHeader
              member={memberUser}
              countLabel={t("support.requestCount").replace(
                "{count}",
                String(group.requests.length)
              )}
              unreadCount={group.unreadCount}
              collapsible
              expanded={expanded}
              onToggle={() => toggleGroup(group.userId)}
            />
            {expanded ? (
              <div className="space-y-2 p-3">
                {group.requests.map((request) => (
                  <GroupRequestRow key={request.id} request={request} locale={locale} />
                ))}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
