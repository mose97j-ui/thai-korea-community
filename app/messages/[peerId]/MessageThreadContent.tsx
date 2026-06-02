"use client";

import Link from "next/link";
import { notFound, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import MessageBubble from "@/components/MessageBubble";
import MessageComposer, {
  type MessageComposerPayload,
} from "@/components/MessageComposer";
import SocialPageShell from "@/components/SocialPageShell";
import UserAvatar from "@/components/UserAvatar";
import { compactSecondaryButtonClassName } from "@/components/ui";
import { pageStickyHeaderClassName } from "@/components/PageShell";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useOperatorView } from "@/hooks/useOperatorView";
import { findUserById } from "@/lib/auth/storage";
import { canSendMessage } from "@/lib/auth/moderation";
import ModerationNotice from "@/components/ModerationNotice";
import { validateMessageContent } from "@/lib/moderation/autoModeration";
import { getPostById } from "@/lib/posts/storage";
import {
  blockUser,
  isMessagingBlocked,
  isUserBlocked,
  unblockUser,
} from "@/lib/social/blocks";
import { handleSendMessage } from "@/lib/social/actions";
import { getConversationId } from "@/lib/social/conversation";
import {
  getMessageSenderLabel,
  getMessagesForConversation,
  markConversationRead,
} from "@/lib/social/messages";
import type { DirectMessage } from "@/lib/social/types";
import { SOCIAL_CHANGE_EVENT } from "@/lib/social/types";

type MessageThreadContentProps = {
  params: Promise<{ peerId: string }>;
};

export default function MessageThreadContent({ params }: MessageThreadContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const { user, isReady } = useAuth();
  const [peerId, setPeerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [messageError, setMessageError] = useState("");
  const [sendSuccess, setSendSuccess] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const relatedPostId = searchParams.get("post");

  useEffect(() => {
    void params.then((route) => setPeerId(route.peerId));
  }, [params]);

  useEffect(() => {
    if (isReady && !user) {
      router.replace(
        `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`
      );
    }
  }, [isReady, user, router]);

  const peer = peerId ? findUserById(peerId) : undefined;
  const relatedPost = relatedPostId ? getPostById(relatedPostId) : null;
  const { showOperatorUI } = useOperatorView();
  const blockedByMe = Boolean(
    user && peerId && isUserBlocked(user.id, peerId)
  );
  const messagingBlocked = Boolean(
    user && peerId && !showOperatorUI && isMessagingBlocked(user.id, peerId)
  );

  const refresh = () => {
    if (!user || !peerId) {
      return;
    }
    const conversationId = getConversationId(user.id, peerId);
    setMessages(getMessagesForConversation(conversationId));
    markConversationRead(conversationId, user.id);
  };

  useEffect(() => {
    refresh();
    window.addEventListener(SOCIAL_CHANGE_EVENT, refresh);
    return () => window.removeEventListener(SOCIAL_CHANGE_EVENT, refresh);
  }, [user?.id, peerId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  if (!isReady || !user || !peerId) {
    return null;
  }

  if (!peer) {
    notFound();
  }

  const messageBlocked = !canSendMessage(user) || messagingBlocked;
  const anonymousLabel = t("social.anonymous");

  const handleSend = async (payload: MessageComposerPayload) => {
    if (messageBlocked) {
      return;
    }

    const validation = validateMessageContent(user, payload.content);
    if (!validation.ok && payload.content.trim()) {
      if (validation.autoRestricted) {
        setMessageError(t("report.errorAutoRestricted"));
      } else {
        setMessageError(
          validation.error === "CONTENT_FILTERED_SEVERE"
            ? t("report.errorFilteredSevere")
            : t("report.errorFiltered")
        );
      }
      return;
    }

    setMessageError("");
    const result = handleSendMessage({
      sender: user,
      recipientId: peer.id,
      content: payload.content,
      sendMode: payload.sendMode,
      anonymousLabel,
      relatedPostId: relatedPostId ?? undefined,
      images: payload.images,
      videoUrl: payload.videoUrl || undefined,
    });

    if (!result.ok) {
      setMessageError(
        result.reason === "blocked"
          ? t("social.messagingBlocked")
          : t("social.messageSelfError")
      );
      return;
    }

    setSendSuccess(true);
    window.setTimeout(() => setSendSuccess(false), 2000);
    refresh();
  };

  const toggleBlock = () => {
    if (!user || !peerId) {
      return;
    }
    if (blockedByMe) {
      unblockUser(user.id, peerId);
    } else {
      blockUser(user.id, peerId);
    }
    refresh();
  };

  return (
    <SocialPageShell>
      <div className={`${pageStickyHeaderClassName} flex items-center gap-3 px-3 py-3`}>
        <Link
          href="/messages"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F0F2F5] text-lg ring-1 ring-black/[0.06]"
          aria-label={t("social.messages")}
        >
          ←
        </Link>
        <UserAvatar user={peer} size="sm" shape="square" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-gray-900">
            {peer.nickname || peer.name}
          </p>
          <p className="text-xs text-gray-500">{t("social.directMessage")}</p>
        </div>
        <button
          type="button"
          onClick={toggleBlock}
          className={`shrink-0 ${compactSecondaryButtonClassName}`}
        >
          {blockedByMe ? t("social.unblockUser") : t("social.blockUser")}
        </button>
      </div>

      {relatedPost ? (
        <div className="border-b border-gray-200 bg-[#F0F2F5] px-3 py-2 text-sm text-gray-700">
          {t("social.relatedPost")}:{" "}
          <Link
            href={`/p/${relatedPost.id}`}
            className="font-semibold text-[#06C755] hover:underline"
          >
            {relatedPost.storeName || relatedPost.title}
          </Link>
        </div>
      ) : null}

      {messagingBlocked ? (
        <div className="border-b border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {blockedByMe ? t("social.blockedByMeHint") : t("social.blockedByPeerHint")}
        </div>
      ) : null}

      <div className="px-3 py-4">
        {messages.length === 0 ? (
          <p className="py-10 text-center text-base text-gray-500">
            {t("social.startConversation")}
          </p>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const mine = message.senderId === user.id;
              const senderLabel = getMessageSenderLabel(
                message,
                user.id,
                user.nickname || user.name,
                anonymousLabel
              );

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  mine={mine}
                  senderLabel={senderLabel}
                  showReport={!mine}
                  showModeration={!mine && showOperatorUI}
                  relatedPostId={relatedPostId ?? undefined}
                  reportedUserId={message.senderId}
                />
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="sticky bottom-0 z-20 border-t border-gray-200 bg-white/95 shadow-[0_-4px_16px_rgb(0_0_0_/0.06)] backdrop-blur-sm">
        {user && !canSendMessage(user) && (
          <div className="px-3 pt-3">
            <ModerationNotice user={user} />
          </div>
        )}

        {messageError ? (
          <p className="px-3 py-2 text-sm font-medium text-rose-600">{messageError}</p>
        ) : null}

        {sendSuccess ? (
          <p className="bg-[#06C755]/5 px-3 py-2 text-sm font-medium text-[#06C755]">
            {t("social.messageSent")}
          </p>
        ) : null}

        <MessageComposer
          onSend={handleSend}
          disabled={messageBlocked}
          compact
          relatedPostTitle={
            relatedPost ? relatedPost.storeName || relatedPost.title : undefined
          }
        />
      </div>
    </SocialPageShell>
  );
}
