"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PostAuthorActions from "@/components/PostAuthorActions";
import { FeedSection, ListItem } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { getHomeCategoryById, getSubCategoryItem } from "@/lib/categories/registry";
import { formatPostDate } from "@/lib/posts/format";
import { getPostDetailHref } from "@/lib/posts/routes";
import { getPostsByAuthorId, POSTS_CHANGE_EVENT } from "@/lib/posts/storage";
import type { Post } from "@/lib/posts/types";

export default function MyPostsPanel() {
  const { user } = useAuth();
  const { t, pick, locale } = useLocale();
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    if (!user) {
      setPosts([]);
      return;
    }

    const refresh = () => setPosts(getPostsByAuthorId(user.id));
    refresh();
    window.addEventListener(POSTS_CHANGE_EVENT, refresh);
    return () => window.removeEventListener(POSTS_CHANGE_EVENT, refresh);
  }, [user?.id]);

  if (!user) {
    return null;
  }

  return (
    <FeedSection
      tone="green"
      icon="📝"
      title={t("mypage.myPosts")}
      description={t("mypage.myPostsDesc")}
    >
      {posts.length === 0 ? (
        <p className="text-ui-caption social-zone social-zone--muted rounded-xl px-4 py-6 text-center text-sm">
          {t("mypage.myPostsEmpty")}
        </p>
      ) : (
        <ul className="space-y-2">
          {posts.map((post) => {
            const category = getHomeCategoryById(post.categoryId);
            const subItem = getSubCategoryItem(post.categoryId, post.subId);
            const title = post.storeName || post.title;

            return (
              <li key={post.id}>
                <ListItem>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={getPostDetailHref(post.id)}
                        className="text-ui-title block text-base hover:text-[#06C755]"
                      >
                        {post.isSecret ? `🔒 ${title}` : title}
                        {post.isHiddenByAuthor ? (
                          <span className="ml-2 inline-flex rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700 ring-1 ring-gray-300">
                            {t("post.hiddenBadge")}
                          </span>
                        ) : null}
                      </Link>
                      <p className="text-ui-caption mt-1.5">
                        <span className="inline-flex rounded-full bg-white px-2 py-0.5 ring-1 ring-black/[0.05]">
                          {category ? pick(category.label) : post.categoryId}
                          {subItem ? ` · ${pick(subItem.title)}` : ""}
                        </span>
                        {" · "}
                        {formatPostDate(post.createdAt, locale)}
                      </p>
                      {post.content ? (
                        <p className="text-ui-body mt-2 line-clamp-2 text-sm">{post.content}</p>
                      ) : null}
                    </div>
                    <PostAuthorActions
                      post={post}
                      userId={user.id}
                      onDeleted={() => setPosts(getPostsByAuthorId(user.id))}
                      className="shrink-0"
                    />
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
