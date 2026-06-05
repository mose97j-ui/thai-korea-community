"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import OperatorMemberGroupHeader from "@/components/operator/OperatorMemberGroupHeader";
import { SectionLabel } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { formatPostDate } from "@/lib/posts/format";
import { getMessageThreadHref } from "@/lib/social/actions";
import type { MessageMemberGroup } from "@/lib/social/groupConversationsByMember";
import type { ConversationPreview } from "@/lib/social/types";
import type { MessageKey } from "@/lib/i18n/messages";

function ThreadRow({
  thread,
  locale,
  href,
  t,
}: {
  thread: ConversationPreview;
  locale: "ko" | "th";
  href: string;
  t: (key: MessageKey) => string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-xl bg-white px-3 py-3 ring-1 ring-black/[0.06] transition hover:ring-[#06C755]/30"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F0F2F5] text-base">
        ✉️
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2">
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${
                thread.unreadCount > 0
                  ? "bg-red-50 text-red-700 ring-red-100"
                  : "bg-emerald-50 text-emerald-700 ring-emerald-100"
              }`}
            >
              {thread.unreadCount > 0 ? t("common.unread") : t("common.read")}
            </span>
            <span className="truncate text-sm font-bold text-gray-900">
              {thread.lastMessage}
            </span>
          </span>
          {thread.unreadCount > 0 ? (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {thread.unreadCount}
            </span>
          ) : null}
        </span>
        <span className="mt-1 block text-[10px] text-gray-400">
          {formatPostDate(thread.lastMessageAt, locale)}
        </span>
      </span>
    </Link>
  );
}

export default function MessageMemberGroupList({
  groups,
  locale,
}: {
  groups: MessageMemberGroup[];
  locale: "ko" | "th";
}) {
  const { t } = useLocale();
  const { user } = useAuth();
  const [openIds, setOpenIds] = useState<Set<string>>(
    () =>
      new Set(
        groups
          .filter((group) => group.unreadCount > 0)
          .map((group) => group.peerId)
      )
  );

  const toggleGroup = useCallback((peerId: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(peerId)) {
        next.delete(peerId);
      } else {
        next.add(peerId);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setOpenIds(new Set(groups.map((group) => group.peerId)));
  }, [groups]);

  const collapseAll = useCallback(() => {
    setOpenIds(new Set());
  }, []);

  const hasMultipleGroups = useMemo(() => groups.length > 1, [groups.length]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionLabel>{t("admin.inboxGroupedByMember")}</SectionLabel>
        {hasMultipleGroups ? (
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
        const expanded = openIds.has(group.peerId);
        const memberUser = {
          id: group.peerId,
          name: group.peerNickname,
          nickname: group.peerNickname,
          profileImage: group.peerProfileImage,
          birthDate: "2000-01-01",
          hometown: "",
          gmail: group.peerGmail,
          koreanPhone: "",
          personalCode: group.peerPersonalCode,
          password: "",
          createdAt: group.latestMessageAt,
        };

        return (
          <section
            key={group.peerId}
            className="overflow-hidden rounded-2xl bg-[#F0F2F5] ring-1 ring-black/[0.06]"
          >
            <OperatorMemberGroupHeader
              member={memberUser}
              countLabel={t("social.threadCount").replace(
                "{count}",
                String(group.threads.length)
              )}
              unreadCount={group.unreadCount}
              collapsible
              expanded={expanded}
              onToggle={() => toggleGroup(group.peerId)}
            />
            {expanded ? (
              <div className="space-y-2 p-3">
                {group.threads.map((thread) => (
                  <ThreadRow
                    key={thread.conversationId}
                    thread={thread}
                    locale={locale}
                    t={t}
                    href={
                      user
                        ? getMessageThreadHref(user.id, thread.peerId)
                        : `/messages/${thread.peerId}`
                    }
                  />
                ))}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
