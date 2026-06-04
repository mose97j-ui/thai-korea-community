"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import {
  getHomeCategoryById,
  getSubCategoryItem,
} from "@/lib/categories/registry";
import {
  clearPostPublishFlash,
  peekPostPublishFlashForBoard,
  type PostPublishFlash,
} from "@/lib/posts/publishFlash";
import { POSTS_CHANGE_EVENT } from "@/lib/posts/storage";
import { getPostById } from "@/lib/posts/storage";

type PostPublishedNoticeProps = {
  categoryId: string;
  subId: string;
  highlightPostId?: string | null;
};

export default function PostPublishedNotice({
  categoryId,
  subId,
  highlightPostId,
}: PostPublishedNoticeProps) {
  const { t, pick } = useLocale();
  const [flash, setFlash] = useState<PostPublishFlash | null>(null);
  const [visible, setVisible] = useState(false);

  const syncFlash = useCallback(() => {
    const next = peekPostPublishFlashForBoard(categoryId, subId);
    setFlash(next);
    setVisible(Boolean(next));
  }, [categoryId, subId]);

  useEffect(() => {
    syncFlash();
    window.addEventListener("hashchange", syncFlash);
    window.addEventListener(POSTS_CHANGE_EVENT, syncFlash);
    return () => {
      window.removeEventListener("hashchange", syncFlash);
      window.removeEventListener(POSTS_CHANGE_EVENT, syncFlash);
    };
  }, [syncFlash, highlightPostId]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    const timer = window.setTimeout(() => {
      setVisible(false);
      clearPostPublishFlash();
    }, 8000);
    return () => window.clearTimeout(timer);
  }, [visible, flash?.postId]);

  const dismiss = () => {
    setVisible(false);
    clearPostPublishFlash();
  };

  if (!visible || !flash) {
    return null;
  }

  const category = getHomeCategoryById(categoryId);
  const subItem = getSubCategoryItem(categoryId, subId);
  const boardLabel =
    category && subItem
      ? `${pick(category.label)} · ${pick(subItem.title)}`
      : category
        ? pick(category.label)
        : "";

  const post = getPostById(flash.postId);
  const title =
    flash.title.trim() ||
    post?.title?.trim() ||
    post?.storeName?.trim() ||
    t("post.publishedUntitled");

  const showScrollHint =
    Boolean(highlightPostId) && highlightPostId === flash.postId;

  return (
    <div
      role="status"
      aria-live="polite"
      className="post-published-notice mb-3"
    >
      <div className="flex gap-3 rounded-2xl border border-[#06C755]/25 bg-gradient-to-br from-[#06C755]/10 to-white px-4 py-3.5 shadow-sm ring-1 ring-[#06C755]/15">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#06C755] text-lg text-white shadow-sm"
          aria-hidden
        >
          ✓
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[#058c3e]">
            {flash.isSecret ? t("post.publishedSecretTitle") : t("post.publishedTitle")}
          </p>
          <p className="mt-1 text-sm leading-snug text-gray-800">
            {flash.isSecret
              ? t("post.publishedSecretDesc")
              : t("post.publishedDesc").replace("{title}", title)}
          </p>
          {boardLabel ? (
            <p className="mt-1 text-xs font-medium text-gray-500">{boardLabel}</p>
          ) : null}
          {showScrollHint ? (
            <p className="mt-2 text-xs text-[#06C755]">{t("post.publishedScrollHint")}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 self-start rounded-full px-2 py-1 text-xs font-semibold text-gray-400 transition hover:bg-black/[0.04] hover:text-gray-600"
          aria-label={t("post.publishedDismiss")}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
