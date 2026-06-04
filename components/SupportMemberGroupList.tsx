"use client";

import UserAvatar from "@/components/UserAvatar";
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

export default function SupportMemberGroupList({
  groups,
  locale,
}: {
  groups: SupportMemberGroup[];
  locale: "ko" | "th";
}) {
  const { t } = useLocale();

  return (
    <div className="space-y-4">
      <SectionLabel>{t("support.groupedByMember")}</SectionLabel>
      {groups.map((group) => {
        const memberUser = {
          id: group.userId,
          name: group.userNickname,
          nickname: group.userNickname,
          profileImage: group.userProfileImage,
          birthDate: "2000-01-01",
          hometown: "",
          gmail: group.userGmail,
          koreanPhone: "",
          personalCode: "",
          password: "",
          createdAt: group.latestUpdatedAt,
        };

        return (
          <section
            key={group.userId}
            className="overflow-hidden rounded-2xl bg-[#F0F2F5] ring-1 ring-black/[0.06]"
          >
            <div className="flex items-center gap-3 border-b border-black/[0.06] bg-white px-4 py-3">
              <UserAvatar user={memberUser} size="sm" shape="square" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-gray-900">
                  {group.userNickname}
                </p>
                <p className="truncate text-xs text-gray-500">{group.userGmail}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[10px] font-semibold text-gray-400">
                  {t("support.requestCount").replace(
                    "{count}",
                    String(group.requests.length)
                  )}
                </p>
                {group.unreadCount > 0 ? (
                  <span className="mt-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                    {group.unreadCount > 99 ? "99+" : group.unreadCount}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="space-y-2 p-3">
              {group.requests.map((request) => (
                <GroupRequestRow key={request.id} request={request} locale={locale} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
