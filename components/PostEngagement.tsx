"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import UserAvatar from "@/components/UserAvatar";
import ContentReportButton from "@/components/ContentReportButton";
import { engagementButtonClassName, inputClassName, primaryButtonClassName } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useOperatorView } from "@/hooks/useOperatorView";
import { validateCommentContent } from "@/lib/moderation/autoModeration";
import { joinContentParts } from "@/lib/moderation/contentFilter";
import { deleteComment, getCommentsByPost } from "@/lib/social/comments";
import { getLikeCount, hasUserLiked } from "@/lib/social/likes";
import {
  handleAddComment,
  handleToggleLike,
} from "@/lib/social/actions";
import { formatPostDate } from "@/lib/posts/format";
import { canComment } from "@/lib/auth/moderation";
import ModerationNotice from "@/components/ModerationNotice";
import type { Post } from "@/lib/posts/types";
import { SOCIAL_CHANGE_EVENT } from "@/lib/social/types";

type PostEngagementProps = {
  post: Post;
  isDetailPage?: boolean;
};

export default function PostEngagement({
  post,
  isDetailPage = false,
}: PostEngagementProps) {
  const router = useRouter();
  const { t, locale } = useLocale();
  const { user } = useAuth();
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [showComments, setShowComments] = useState(isDetailPage);
  const [comments, setComments] = useState(
    () => getCommentsByPost(post.id)
  );
  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState("");

  const { showOperatorUI } = useOperatorView();
  const commentBlocked = Boolean(user && !canComment(user));
  const operator = showOperatorUI;
  const showMessageButton = Boolean(user && user.id !== post.authorId);
  const postPreview = joinContentParts(
    post.storeName,
    post.title,
    post.content,
    post.address
  );

  const refresh = () => {
    setLikeCount(getLikeCount(post.id));
    setLiked(user ? hasUserLiked(post.id, user.id) : false);
    setCommentCount(getCommentsByPost(post.id).length);
    setComments(getCommentsByPost(post.id));
  };

  useEffect(() => {
    refresh();
    window.addEventListener(SOCIAL_CHANGE_EVENT, refresh);
    return () => window.removeEventListener(SOCIAL_CHANGE_EVENT, refresh);
  }, [post.id, user?.id]);

  const handleLike = () => {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/p/${post.id}`)}`);
      return;
    }
    const result = handleToggleLike(post, user);
    setLiked(result.liked);
    setLikeCount(result.count);
  };

  const handleCommentSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/p/${post.id}`)}`);
      return;
    }
    if (!commentText.trim()) {
      return;
    }
    if (commentBlocked) {
      return;
    }
    const validation = validateCommentContent(user, commentText);
    if (!validation.ok) {
      if (validation.autoRestricted) {
        setCommentError(t("report.errorAutoRestricted"));
      } else {
        setCommentError(
          validation.error === "CONTENT_FILTERED_SEVERE"
            ? t("report.errorFilteredSevere")
            : t("report.errorFiltered")
        );
      }
      return;
    }
    setCommentError("");
    handleAddComment(post, user, commentText);
    setCommentText("");
    setShowComments(true);
    refresh();
  };

  const handleMessageAuthor = () => {
    if (!user) {
      router.push("/login?next=%2Fsupport%2Fnew");
      return;
    }
    router.push("/support/new");
  };

  const handleDeleteComment = (commentId: string) => {
    if (!user) {
      return;
    }
    if (!window.confirm(t("social.deleteCommentConfirm"))) {
      return;
    }
    deleteComment(commentId, user.id);
    refresh();
  };

  return (
    <>
      <div className="social-zone--engagement">
        <div className="social-action-bar">
          <button
            type="button"
            onClick={handleLike}
            className={`${engagementButtonClassName} ${
              liked ? "bg-rose-50 text-rose-600 ring-rose-200" : ""
            }`}
          >
            <span>{liked ? "❤️" : "🤍"}</span>
            <span>{likeCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowComments((value) => !value)}
            className={`${engagementButtonClassName} ${
              showComments ? "bg-[#06C755]/10 text-[#06C755] ring-[#06C755]/20" : ""
            }`}
          >
            <span>💬</span>
            <span>{commentCount}</span>
          </button>

          {showMessageButton ? (
            <button
              type="button"
              onClick={handleMessageAuthor}
              className={engagementButtonClassName}
            >
              <span>📮</span>
              <span className="hidden sm:inline">{t("support.newRequest")}</span>
              <span className="sm:hidden">{t("support.title")}</span>
            </button>
          ) : null}
        </div>

        {(!isDetailPage || !operator) && (
          <div className="social-meta-bar">
            {!isDetailPage && (
              <Link
                href={`/p/${post.id}`}
                className="text-ui-btn text-sm font-semibold text-[#06C755] hover:underline"
              >
                {t("social.viewPost")}
              </Link>
            )}
            {!operator && (
              <ContentReportButton
                targetType="post"
                targetId={post.id}
                reportedUserId={post.authorId}
                reportedUserNickname={post.authorNickname}
                contentPreview={postPreview}
                compact
                className={isDetailPage ? "" : "w-full"}
              />
            )}
          </div>
        )}
      </div>

      {showComments && (
        <div className="social-zone--comments">
          <p className="section-label mb-3 !mt-0">💬 {t("social.commentsTitle")}</p>
          {comments.length === 0 ? (
            <p className="text-sm text-gray-500">{t("social.noComments")}</p>
          ) : (
            <div className="space-y-2">
              {comments.map((comment) => {
              const commentAuthor = {
                id: comment.authorId,
                name: comment.authorNickname,
                nickname: comment.authorNickname,
                profileImage: comment.authorProfileImage,
                birthDate: "2000-01-01",
                hometown: "",
                gmail: "",
                koreanPhone: "",
                personalCode: "",
                password: "",
                createdAt: comment.createdAt,
              };

              return (
                <div
                  key={comment.id}
                  className="social-comment-bubble flex gap-3"
                >
                  <UserAvatar user={commentAuthor} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <p className="text-ui-title text-sm">{comment.authorNickname}</p>
                      <p className="text-ui-caption">
                        {formatPostDate(comment.createdAt, locale)}
                      </p>
                    </div>
                    <p className="text-ui-body mt-1 whitespace-pre-wrap text-[#050505]">
                      {comment.content}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-black/[0.04] pt-3">
                      {user?.id === comment.authorId ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-xs font-semibold text-rose-600 hover:underline"
                        >
                          🗑 {t("social.deleteComment")}
                        </button>
                      ) : null}
                      {!operator && (
                        <ContentReportButton
                          targetType="comment"
                          targetId={comment.id}
                          postId={post.id}
                          reportedUserId={comment.authorId}
                          reportedUserNickname={comment.authorNickname}
                          contentPreview={comment.content}
                          compact
                          className={user?.id === comment.authorId ? "" : "w-full"}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          )}

          {user && commentBlocked && (
            <ModerationNotice user={user} className="mt-2" />
          )}

          {commentError && (
            <p className="text-sm font-medium text-rose-600">{commentError}</p>
          )}

          <form onSubmit={handleCommentSubmit} className="flex flex-col gap-2 sm:flex-row">
            <input
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder={t("social.commentPlaceholder")}
              className={`min-w-0 flex-1 !bg-white !text-[#050505] ${inputClassName}`}
              maxLength={500}
              disabled={commentBlocked}
            />
            <button
              type="submit"
              disabled={commentBlocked}
              className={`shrink-0 ${primaryButtonClassName} !px-5 !py-3 text-base disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto w-full`}
            >
              {t("social.commentSubmit")}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
