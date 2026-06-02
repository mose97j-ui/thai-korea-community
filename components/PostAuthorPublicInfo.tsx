"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import MessageComposer, {
  type MessageComposerPayload,
} from "@/components/MessageComposer";
import UserAvatar from "@/components/UserAvatar";
import { compactSecondaryButtonClassName } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { canSendMessage } from "@/lib/auth/moderation";
import { useOperatorView } from "@/hooks/useOperatorView";
import { validateMessageContent } from "@/lib/moderation/autoModeration";
import { formatPostDate } from "@/lib/posts/format";
import type { Post } from "@/lib/posts/types";
import type { User } from "@/lib/auth/types";
import {
  getMessageThreadHref,
  handleSendMessage,
} from "@/lib/social/actions";
import { isMessagingBlocked } from "@/lib/social/blocks";

type PostAuthorPublicInfoProps = {
  post: Post;
  author: User;
  hideMessageActions?: boolean;
};

export default function PostAuthorPublicInfo({
  post,
  author,
  hideMessageActions = false,
}: PostAuthorPublicInfoProps) {
  const router = useRouter();
  const { t, locale } = useLocale();
  const { user } = useAuth();
  const [showComposer, setShowComposer] = useState(false);
  const [messageError, setMessageError] = useState("");
  const [messageSent, setMessageSent] = useState(false);

  const { hasOperatorPrivileges } = useOperatorView();
  const messageBlocked = Boolean(user && !canSendMessage(user));
  const messagingBlocked = Boolean(
    user &&
      !hasOperatorPrivileges &&
      isMessagingBlocked(user.id, post.authorId)
  );
  const showMessageButton = Boolean(user && user.id !== post.authorId);

  const setComposerOpen = (open: boolean) => {
    setShowComposer(open);
  };

  const handleMessageClick = () => {
    if (!user) {
      router.push(
        `/login?next=${encodeURIComponent(getMessageThreadHref("guest", post.authorId, post.id))}`
      );
      return;
    }
    if (messageBlocked || messagingBlocked) {
      return;
    }
    setComposerOpen(!showComposer);
    setMessageError("");
    setMessageSent(false);
  };

  const handleSend = async (payload: MessageComposerPayload) => {
    if (!user || messageBlocked || messagingBlocked) {
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

    const result = handleSendMessage({
      sender: user,
      recipientId: post.authorId,
      content: payload.content,
      sendMode: payload.sendMode,
      anonymousLabel: t("social.anonymous"),
      relatedPostId: post.id,
      images: payload.images,
      videoUrl: payload.videoUrl || undefined,
    });

    if (!result.ok) {
      setMessageError(t("social.messagingBlocked"));
      return;
    }

    setMessageError("");
    setMessageSent(true);
    setComposerOpen(false);
    window.setTimeout(() => setMessageSent(false), 2500);
  };

  return (
    <div className="flex shrink-0 flex-col items-end gap-2">
      <div className="flex items-start gap-2.5">
        <div className="min-w-0 max-w-[8rem] text-right sm:max-w-[9.5rem]">
          <p className="truncate text-sm font-bold text-gray-900">
            {post.authorNickname}
          </p>
          <p className="mt-0.5 whitespace-nowrap text-xs text-gray-400">
            {formatPostDate(post.createdAt, locale)}
          </p>
        </div>
        <UserAvatar user={author} size="sm" />
      </div>

      {showMessageButton && !hideMessageActions ? (
        <button
          type="button"
          onClick={handleMessageClick}
          disabled={messageBlocked || messagingBlocked}
          className={`${compactSecondaryButtonClassName} !px-3 !py-1.5 text-xs`}
        >
          ✉️ {t("social.messageAuthor")}
        </button>
      ) : null}

      {showMessageButton && !hideMessageActions && messageSent ? (
        <p className="text-xs font-medium text-[#06C755]">{t("social.messageSent")}</p>
      ) : null}

      {showMessageButton && !hideMessageActions && messagingBlocked ? (
        <p className="max-w-[9.5rem] text-right text-xs text-rose-600">
          {t("social.messagingBlocked")}
        </p>
      ) : null}

      {showComposer && user && !messageBlocked && !messagingBlocked && !hideMessageActions ? (
        <div className="mt-1 w-[min(100vw-2.5rem,22rem)] overflow-hidden rounded-2xl ring-1 ring-black/[0.06]">
          <div className="flex items-center justify-between gap-2 border-b border-gray-100 bg-[#F0F2F5] px-3 py-2">
            <p className="truncate text-xs font-semibold text-gray-900">
              {t("social.messageAuthor")}
            </p>
            <Link
              href={getMessageThreadHref(user.id, post.authorId, post.id)}
              className="shrink-0 text-xs font-semibold text-[#06C755] hover:underline"
            >
              {t("social.openThread")}
            </Link>
          </div>
          <MessageComposer
            onSend={handleSend}
            compact
            relatedPostTitle={post.storeName || post.title}
          />
          {messageError ? (
            <p className="border-t border-gray-100 bg-white px-3 py-2 text-xs text-rose-600">
              {messageError}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
