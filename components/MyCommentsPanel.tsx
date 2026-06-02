"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FeedSection, ListItem } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { formatPostDate } from "@/lib/posts/format";
import { getPostById } from "@/lib/posts/storage";
import { getPostDetailHref } from "@/lib/posts/routes";
import { deleteComment, getCommentsByAuthorId } from "@/lib/social/comments";
import { SOCIAL_CHANGE_EVENT } from "@/lib/social/types";
import type { PostComment } from "@/lib/social/types";

export default function MyCommentsPanel() {
  const { user } = useAuth();
  const { t, locale } = useLocale();
  const [comments, setComments] = useState<PostComment[]>([]);

  useEffect(() => {
    if (!user) {
      setComments([]);
      return;
    }

    const refresh = () => setComments(getCommentsByAuthorId(user.id));
    refresh();
    window.addEventListener(SOCIAL_CHANGE_EVENT, refresh);
    return () => window.removeEventListener(SOCIAL_CHANGE_EVENT, refresh);
  }, [user?.id]);

  if (!user) {
    return null;
  }

  const handleDelete = (commentId: string) => {
    if (!window.confirm(t("social.deleteCommentConfirm"))) {
      return;
    }
    deleteComment(commentId, user.id);
    setComments(getCommentsByAuthorId(user.id));
  };

  return (
    <FeedSection
      tone="violet"
      icon="💬"
      title={t("mypage.myComments")}
      description={t("mypage.myCommentsDesc")}
    >
      {comments.length === 0 ? (
        <p className="text-ui-caption social-zone social-zone--muted rounded-xl px-4 py-6 text-center text-sm">
          {t("mypage.myCommentsEmpty")}
        </p>
      ) : (
        <ul className="space-y-2">
          {comments.map((comment) => {
            const post = getPostById(comment.postId);
            const postTitle = post
              ? post.storeName || post.title
              : t("mypage.postDeleted");

            return (
              <li key={comment.id}>
                <ListItem>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      {post ? (
                        <Link
                          href={getPostDetailHref(post.id)}
                          className="text-ui-chip inline-flex rounded-full bg-[#06C755]/10 px-2.5 py-1 text-xs font-semibold text-[#06C755] hover:underline"
                        >
                          {t("mypage.viewPost")}: {postTitle}
                        </Link>
                      ) : (
                        <p className="text-ui-caption text-xs">{t("mypage.postDeleted")}</p>
                      )}
                      <p className="text-ui-body mt-2 whitespace-pre-wrap text-sm text-[#050505]">
                        {comment.content}
                      </p>
                      <p className="text-ui-caption mt-2">
                        {formatPostDate(comment.createdAt, locale)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(comment.id)}
                      className="shrink-0 rounded-full bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-600 ring-1 ring-rose-100 transition hover:bg-rose-100"
                    >
                      🗑 {t("social.deleteComment")}
                    </button>
                  </div>
                </ListItem>
              </li>
            );
          })}
        </ul>
      )}
    </FeedSection>
  );
}
