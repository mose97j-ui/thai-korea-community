"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import OperatorMemberGroupHeader from "@/components/operator/OperatorMemberGroupHeader";
import { Card, SectionLabel, pillButtonClassName } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { formatPostDate } from "@/lib/posts/format";
import { getMessageThreadHref } from "@/lib/social/actions";
import { groupConversationsByMember } from "@/lib/social/groupConversationsByMember";
import { getConversationsForUser } from "@/lib/social/messages";
import { MESSAGES_SYNC_EVENT } from "@/lib/social/messageSync";
import type { ConversationPreview } from "@/lib/social/types";
import { SOCIAL_CHANGE_EVENT } from "@/lib/social/types";

export default function OperatorMessagesPanel() {
  const { t, locale } = useLocale();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);

  const refresh = useCallback(() => {
    if (!user) {
      setConversations([]);
      return;
    }
    setConversations(
      getConversationsForUser(user, {
        photo: t("social.previewPhoto"),
        video: t("social.previewVideo"),
        empty: t("social.previewEmpty"),
      })
    );
  }, [user, t]);

  useEffect(() => {
    refresh();
    window.addEventListener(SOCIAL_CHANGE_EVENT, refresh);
    window.addEventListener(MESSAGES_SYNC_EVENT, refresh);
    return () => {
      window.removeEventListener(SOCIAL_CHANGE_EVENT, refresh);
      window.removeEventListener(MESSAGES_SYNC_EVENT, refresh);
    };
  }, [refresh]);

  const memberGroups = useMemo(
    () => (user ? groupConversationsByMember(conversations, user).slice(0, 5) : []),
    [conversations, user]
  );

  const unreadTotal = conversations.reduce((sum, item) => sum + item.unreadCount, 0);

  return (
    <Card className="mb-4 border-l-4 border-l-emerald-500 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xl font-bold text-gray-900">{t("admin.operatorMessagesTitle")}</p>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            {t("admin.operatorMessagesDesc")}
          </p>
        </div>
        <Link href="/messages" className={pillButtonClassName}>
          {t("admin.operatorMessagesViewAll")}
          {unreadTotal > 0 ? ` (${unreadTotal})` : ""}
        </Link>
      </div>

      {memberGroups.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">{t("admin.operatorMessagesEmpty")}</p>
      ) : (
        <div className="mt-4 space-y-3">
          <SectionLabel>{t("admin.inboxGroupedByMember")}</SectionLabel>
          {memberGroups.map((group) => {
            const thread = group.threads[0];
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
              <Link
                key={group.peerId}
                href={
                  user && thread
                    ? getMessageThreadHref(user.id, thread.peerId)
                    : `/messages/${group.peerId}`
                }
                className="block overflow-hidden rounded-2xl bg-[#F0F2F5] ring-1 ring-black/[0.06] transition hover:ring-[#06C755]/30"
              >
                <OperatorMemberGroupHeader
                  member={memberUser}
                  countLabel={t("social.threadCount").replace(
                    "{count}",
                    String(group.threads.length)
                  )}
                  unreadCount={group.unreadCount}
                  compact
                />
                {thread ? (
                  <p className="line-clamp-2 px-3 pb-3 text-xs leading-relaxed text-gray-600">
                    {thread.lastMessage}
                    <span className="mt-1 block text-[10px] text-gray-400">
                      {formatPostDate(thread.lastMessageAt, locale)}
                    </span>
                  </p>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
}
