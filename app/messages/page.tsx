"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SocialPageShell from "@/components/SocialPageShell";
import UserAvatar from "@/components/UserAvatar";
import { pageStickyHeaderClassName } from "@/components/PageShell";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { formatPostDate } from "@/lib/posts/format";
import { getConversationsForUser } from "@/lib/social/messages";
import type { ConversationPreview } from "@/lib/social/types";
import { SOCIAL_CHANGE_EVENT } from "@/lib/social/types";

export default function MessagesPage() {
  const router = useRouter();
  const { t, locale } = useLocale();
  const { user, isReady } = useAuth();
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);

  useEffect(() => {
    if (isReady && !user) {
      router.replace("/login?next=%2Fmessages");
    }
  }, [isReady, user, router]);

  const refresh = () => {
    if (user) {
      setConversations(
        getConversationsForUser(user.id, {
          photo: t("social.previewPhoto"),
          video: t("social.previewVideo"),
          empty: t("social.previewEmpty"),
        })
      );
    }
  };

  useEffect(() => {
    refresh();
    window.addEventListener(SOCIAL_CHANGE_EVENT, refresh);
    return () => window.removeEventListener(SOCIAL_CHANGE_EVENT, refresh);
  }, [user?.id, locale]);

  if (!isReady || !user) {
    return null;
  }

  return (
    <SocialPageShell>
      <div className={`${pageStickyHeaderClassName} flex items-center gap-3 px-3 py-3`}>
        <Link
          href="/"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F0F2F5] text-lg ring-1 ring-black/[0.06]"
          aria-label={t("common.backHome")}
        >
          ←
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold text-gray-900">
            {t("social.messages")}
          </h1>
          <p className="text-xs text-gray-500">{t("social.messagesDesc")}</p>
        </div>
      </div>

      {conversations.length === 0 ? (
        <div className="px-3 py-16 text-center text-base text-gray-500">
          {t("social.noMessages")}
        </div>
      ) : (
        <div className="divide-y divide-gray-200/80 bg-white">
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
              <Link
                key={conversation.conversationId}
                href={`/messages/${conversation.peerId}`}
                className="flex items-center gap-3 px-3 py-3.5 transition active:bg-gray-50"
              >
                <UserAvatar user={peerUser} size="md" shape="square" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-base font-bold text-gray-900">
                      {conversation.peerNickname}
                    </p>
                    <p className="shrink-0 text-xs text-gray-400">
                      {formatPostDate(conversation.lastMessageAt, locale)}
                    </p>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-sm leading-snug text-gray-600">
                    {conversation.lastMessage}
                  </p>
                </div>
                {conversation.unreadCount > 0 ? (
                  <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                    {conversation.unreadCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </SocialPageShell>
  );
}
