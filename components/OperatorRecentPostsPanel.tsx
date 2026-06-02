"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import OperatorPostAuthorInfo from "@/components/OperatorPostAuthorInfo";
import { Card, SectionLabel } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useOperatorView } from "@/hooks/useOperatorView";
import {
  getHomeCategoryById,
  getSubCategoryItem,
} from "@/lib/categories/registry";
import { formatPostDate } from "@/lib/posts/format";
import { getAllPosts, POSTS_CHANGE_EVENT } from "@/lib/posts/storage";
import type { Post } from "@/lib/posts/types";

export default function OperatorRecentPostsPanel() {
  const { t, pick, locale } = useLocale();
  const { user } = useAuth();
  const { showOperatorUI } = useOperatorView();
  const [posts, setPosts] = useState<Post[]>([]);

  const refresh = useCallback(() => {
    setPosts(getAllPosts().slice(0, 12));
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener(POSTS_CHANGE_EVENT, refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener(POSTS_CHANGE_EVENT, refresh);
    };
  }, [refresh]);

  const recentCount = useMemo(() => posts.length, [posts]);

  if (!user || !showOperatorUI) {
    return null;
  }

  return (
    <Card className="mb-4 border-l-4 border-l-sky-500 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xl font-bold text-gray-900">
            {t("operator.recentPostsTitle")}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            {t("operator.recentPostsDesc")}
          </p>
        </div>
        <span className="rounded-full bg-sky-100 px-3 py-1.5 text-sm font-bold text-sky-700 ring-1 ring-sky-200">
          {t("operator.recentPostsCount").replace("{count}", String(recentCount))}
        </span>
      </div>

      {posts.length === 0 ? (
        <p className="mt-5 text-sm text-gray-500">{t("operator.recentPostsEmpty")}</p>
      ) : (
        <div className="mt-5 space-y-4">
          <SectionLabel>{t("operator.recentPostsList")}</SectionLabel>
          {posts.map((post) => {
            const category = getHomeCategoryById(post.categoryId);
            const subItem = getSubCategoryItem(post.categoryId, post.subId);
            const title = post.storeName || post.title;

            return (
              <div
                key={post.id}
                className="rounded-2xl bg-[#F8F9FA] p-4 ring-1 ring-black/[0.04]"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900">{title}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {formatPostDate(post.createdAt, locale)}
                      {category ? ` · ${pick(category.label)}` : ""}
                      {subItem ? ` · ${pick(subItem.title)}` : ""}
                    </p>
                  </div>
                  <Link
                    href={`/p/${post.id}`}
                    className="shrink-0 text-sm font-semibold text-[#06C755] hover:underline"
                  >
                    {t("social.viewPost")}
                  </Link>
                </div>

                <div className="mt-3">
                  <OperatorPostAuthorInfo post={post} compact showModeration={false} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
