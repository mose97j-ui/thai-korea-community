"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { compactSecondaryButtonClassName, dangerButtonClassName } from "@/components/ui";
import { useLocale } from "@/contexts/LocaleContext";
import { getPostEditHref } from "@/lib/posts/routes";
import { deletePost, setPostHiddenByAuthor } from "@/lib/posts/storage";
import type { Post } from "@/lib/posts/types";

type PostAuthorActionsProps = {
  post: Post;
  userId: string;
  compact?: boolean;
  onDeleted?: () => void;
  onUpdated?: () => void;
  className?: string;
};

export default function PostAuthorActions({
  post,
  userId,
  compact = false,
  onDeleted,
  onUpdated,
  className = "",
}: PostAuthorActionsProps) {
  const router = useRouter();
  const { t } = useLocale();

  if (post.authorId !== userId) {
    return null;
  }

  const buttonClass = compact
    ? `${compactSecondaryButtonClassName} !px-2.5 !py-1.5 text-xs`
    : `${compactSecondaryButtonClassName} !px-3 !py-2 text-sm`;

  const dangerClass = compact
    ? `${dangerButtonClassName} !px-2.5 !py-1.5 text-xs`
    : `${dangerButtonClassName} !px-3 !py-2 text-sm`;

  const handleDelete = () => {
    if (!window.confirm(t("post.deleteConfirm"))) {
      return;
    }
    deletePost(post.id);
    if (onDeleted) {
      onDeleted();
      return;
    }
    router.push(`/c/${post.categoryId}/${post.subId}`);
  };

  const handleToggleHide = () => {
    const nextHidden = !post.isHiddenByAuthor;
    if (nextHidden && !window.confirm(t("post.hideConfirm"))) {
      return;
    }
    setPostHiddenByAuthor(post.id, userId, nextHidden);
    onUpdated?.();
  };

  return (
    <div
      className={`flex flex-wrap gap-1.5 sm:gap-2 ${className}`}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <Link href={getPostEditHref(post.id)} className={buttonClass}>
        ✏️ {t("post.edit")}
      </Link>
      <button type="button" onClick={handleToggleHide} className={buttonClass}>
        {post.isHiddenByAuthor ? `👁 ${t("post.unhide")}` : `🙈 ${t("post.hide")}`}
      </button>
      <button type="button" onClick={handleDelete} className={dangerClass}>
        🗑 {t("post.delete")}
      </button>
    </div>
  );
}
