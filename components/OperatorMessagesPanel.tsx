"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import UserAvatar from "@/components/UserAvatar";
import { Card, SectionLabel, pillButtonClassName } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { formatPostDate } from "@/lib/posts/format";
import { getMessageThreadHref } from "@/lib/social/actions";
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
      }).slice(0, 6)
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

      {conversations.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">{t("admin.operatorMessagesEmpty")}</p>
      ) : (
        <ul className="mt-4 space-y-2">
          <SectionLabel>{t("admin.operatorMessagesRecent")}</SectionLabel>
          {conversations.map((conversation) => {
            const peerUser = {
              id: conversation.peerId,
              name: conversation.peerNickname,
              nickname: conversation.peerNickname,
              profileImage: conversation.peerProfileImage,
              birthDate: "2000-01-01",
              hometown: "",
              gmail: "",
              koreanPhone: "",
              personalCode: "",
              password: "",
              createdAt: conversation.lastMessageAt,
            };

            return (
              <li key={conversation.conversationId}>
                <Link
                  href={
                    user
                      ? getMessageThreadHref(user.id, conversation.peerId)
                      : `/messages/${conversation.peerId}`
                  }
                  className="flex items-center gap-3 rounded-xl bg-[#F0F2F5] px-3 py-3 ring-1 ring-black/[0.06] transition hover:bg-white"
                >
                  <UserAvatar user={peerUser} size="sm" shape="square" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-bold text-gray-900">
                        {conversation.peerNickname}
                      </span>
                      <span className="shrink-0 text-[10px] text-gray-400">
                        {formatPostDate(conversation.lastMessageAt, locale)}
                      </span>
                    </span>
                    <span className="mt-0.5 line-clamp-1 block text-xs text-gray-600">
                      {conversation.lastMessage}
                    </span>
                  </span>
                  {conversation.unreadCount > 0 ? (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {conversation.unreadCount}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
