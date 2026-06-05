"use client";

import Link from "next/link";
import OperatorMemberGroupHeader from "@/components/operator/OperatorMemberGroupHeader";
import { SectionLabel } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { formatPostDate } from "@/lib/posts/format";
import { getMessageThreadHref } from "@/lib/social/actions";
import type { MessageMemberGroup } from "@/lib/social/groupConversationsByMember";
import type { ConversationPreview } from "@/lib/social/types";

function ThreadRow({
  thread,
  locale,
  href,
}: {
  thread: ConversationPreview;
  locale: "ko" | "th";
  href: string;
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
          <span className="truncate text-sm font-bold text-gray-900">
            {thread.lastMessage}
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

  return (
    <div className="space-y-4">
      <SectionLabel>{t("admin.inboxGroupedByMember")}</SectionLabel>
      {groups.map((group) => {
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
            />
            <div className="space-y-2 p-3">
              {group.threads.map((thread) => (
                <ThreadRow
                  key={thread.conversationId}
                  thread={thread}
                  locale={locale}
                  href={
                    user
                      ? getMessageThreadHref(user.id, thread.peerId)
                      : `/messages/${thread.peerId}`
                  }
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
