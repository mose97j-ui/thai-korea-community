"use client";

import PostMediaDisplay from "@/components/PostMediaDisplay";
import ContentModerationActions from "@/components/ContentModerationActions";
import ContentReportButton from "@/components/ContentReportButton";
import { useLocale } from "@/contexts/LocaleContext";
import { formatPostDate } from "@/lib/posts/format";
import type { DirectMessage } from "@/lib/social/types";

type MessageBubbleProps = {
  message: DirectMessage;
  mine: boolean;
  senderLabel: string;
  showModeration?: boolean;
  showReport?: boolean;
  canRecall?: boolean;
  onRecall?: () => void;
  canDelete?: boolean;
  onDelete?: () => void;
  relatedPostId?: string;
  reportedUserId: string;
};

export default function MessageBubble({
  message,
  mine,
  senderLabel,
  showModeration = false,
  showReport = false,
  canRecall = false,
  onRecall,
  canDelete = false,
  onDelete,
  relatedPostId,
  reportedUserId,
}: MessageBubbleProps) {
  const { t, locale } = useLocale();
  const preview = [
    message.content,
    ...(message.images?.length ? [t("social.previewPhoto")] : []),
    ...(message.videoUrl ? [t("social.previewVideo")] : []),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className={`flex w-full ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex w-full max-w-none flex-col ${
          mine ? "items-end" : "items-stretch"
        }`}
      >
        {!mine ? (
          <p className="mb-1 px-1 text-xs font-semibold text-gray-500">
            {senderLabel}
            {message.sendMode === "anonymous" ? (
              <span className="ml-1 font-normal text-gray-400">
                · {t("social.anonymousBadge")}
              </span>
            ) : null}
          </p>
        ) : null}

        <div
          className={`max-w-[92%] rounded-2xl px-4 py-3 ${
            mine
              ? "self-end bg-[#06C755] text-white"
              : "self-start bg-white text-gray-900 ring-1 ring-black/[0.06]"
          }`}
        >
          {canRecall || (canDelete && onDelete) ? (
            <div className={`mb-1 flex flex-wrap gap-1 ${mine ? "justify-end" : "justify-start"}`}>
              {canRecall && onRecall ? (
                <button
                  type="button"
                  onClick={onRecall}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    mine
                      ? "bg-white/20 text-white hover:bg-white/30"
                      : "text-gray-500 ring-1 ring-black/[0.08] hover:bg-amber-50 hover:text-amber-700"
                  }`}
                >
                  {t("social.recallMessage")}
                </button>
              ) : null}
              {canDelete && onDelete ? (
                <button
                  type="button"
                  onClick={onDelete}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    mine
                      ? "bg-white/20 text-white hover:bg-white/30"
                      : "text-gray-500 ring-1 ring-black/[0.08] hover:bg-rose-50 hover:text-rose-600"
                  }`}
                >
                  {t("common.delete")}
                </button>
              ) : null}
            </div>
          ) : null}
          {message.content ? (
            <p className="whitespace-pre-wrap text-base leading-relaxed">
              {message.content}
            </p>
          ) : null}

          {message.images?.length || message.videoUrl ? (
            <div className={message.content ? "mt-3" : ""}>
              <PostMediaDisplay
                images={message.images}
                videoUrl={message.videoUrl}
              />
            </div>
          ) : null}

          <p className={`mt-2 text-xs ${mine ? "text-white/70" : "text-gray-400"}`}>
            {formatPostDate(message.createdAt, locale)}
            {mine && message.sendMode === "anonymous" ? (
              <span className="ml-1">· {t("social.sentAnonymously")}</span>
            ) : null}
          </p>
        </div>

        {mine ? (
          <p className="mt-1 px-1 text-[11px] font-semibold text-gray-500">
            {message.readAt ? t("common.read") : t("common.unread")}
          </p>
        ) : null}

        {!mine && (showReport || showModeration) ? (
          <div className="mt-2 w-full max-w-[92%] space-y-2">
            {showReport ? (
              <ContentReportButton
                targetType="message"
                targetId={message.id}
                postId={relatedPostId}
                reportedUserId={reportedUserId}
                reportedUserNickname={senderLabel}
                contentPreview={preview}
                compact
                className="w-full"
              />
            ) : null}
            {showModeration ? (
              <div className="rounded-xl bg-amber-50/70 p-2 ring-1 ring-amber-100/80">
                <ContentModerationActions
                  targetUserId={reportedUserId}
                  targetType="message"
                  targetId={message.id}
                  compact
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
