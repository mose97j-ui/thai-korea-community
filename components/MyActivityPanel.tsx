"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import MenuIcon from "@/components/MenuIcon";
import PostAuthorActions from "@/components/PostAuthorActions";
import { FeedSection, FilterChip, ListItem } from "@/components/ui";
import { useCategoryRegistryVersion } from "@/contexts/CategoryRegistryContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useUserMenus } from "@/hooks/useUserMenus";
import { getHomeCategoryById, getSubCategoryItem } from "@/lib/categories/registry";
import {
  buildActivityRows,
  collectActivityScopeOptions,
  countActivityRows,
  filterActivityRows,
  scopeFilterKey,
  type ActivityScopeFilter,
  type ActivityTypeFilter,
} from "@/lib/mypage/activityFilters";
import { getDefaultCategoryBoardHref } from "@/lib/mypage/boardHref";
import { formatPostDate } from "@/lib/posts/format";
import { getPostBoardHref } from "@/lib/posts/routes";
import { getPostById, getPostsByAuthorId, POSTS_CHANGE_EVENT } from "@/lib/posts/storage";
import type { Post } from "@/lib/posts/types";
import { deleteComment, getCommentsByAuthorId } from "@/lib/social/comments";
import { SOCIAL_CHANGE_EVENT } from "@/lib/social/types";
import type { PostComment } from "@/lib/social/types";

export default function MyActivityPanel() {
  const { user } = useAuth();
  const { t, pick, locale } = useLocale();
  const registryVersion = useCategoryRegistryVersion();
  const { userCategories } = useUserMenus();
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [typeFilter, setTypeFilter] = useState<ActivityTypeFilter>("all");
  const [scopeFilter, setScopeFilter] = useState<ActivityScopeFilter>({ mode: "all" });

  useEffect(() => {
    if (!user) {
      setPosts([]);
      setComments([]);
      return;
    }

    const refreshPosts = () => setPosts(getPostsByAuthorId(user.id));
    const refreshComments = () => setComments(getCommentsByAuthorId(user.id));

    refreshPosts();
    refreshComments();
    window.addEventListener(POSTS_CHANGE_EVENT, refreshPosts);
    window.addEventListener(SOCIAL_CHANGE_EVENT, refreshComments);
    return () => {
      window.removeEventListener(POSTS_CHANGE_EVENT, refreshPosts);
      window.removeEventListener(SOCIAL_CHANGE_EVENT, refreshComments);
    };
  }, [user?.id]);

  const allRows = useMemo(
    () => buildActivityRows(posts, comments),
    [posts, comments]
  );

  const ownedMenus = useMemo(
    () => userCategories.filter((menu) => menu.creatorId === user?.id),
    [userCategories, user?.id]
  );

  const scopeOptions = useMemo(() => {
    void registryVersion;
    const fromActivity = collectActivityScopeOptions(allRows);
    const keys = new Set(fromActivity.map((option) => option.key));

    for (const menu of ownedMenus) {
      const catKey = `cat:${menu.id}`;
      if (!keys.has(catKey)) {
        fromActivity.push({
          key: catKey,
          scope: { mode: "category", categoryId: menu.id },
          categoryId: menu.id,
        });
        keys.add(catKey);
      }
    }

    return fromActivity;
  }, [allRows, ownedMenus, registryVersion]);

  const filteredRows = useMemo(
    () => filterActivityRows(allRows, typeFilter, scopeFilter),
    [allRows, typeFilter, scopeFilter]
  );

  const typeTabs = useMemo(
    () =>
      [
        { id: "all" as const, label: t("mypage.tabAll") },
        { id: "posts" as const, label: t("mypage.tabAllPosts") },
        { id: "comments" as const, label: t("mypage.tabComments") },
      ].map((tab) => ({
        ...tab,
        count: countActivityRows(allRows, tab.id, scopeFilter),
      })),
    [allRows, scopeFilter, t]
  );

  const scopeLabel = useMemo(() => {
    void registryVersion;
    if (scopeFilter.mode === "all") {
      return t("mypage.scopeAll");
    }
    const category = getHomeCategoryById(scopeFilter.categoryId);
    const categoryLabel = category ? pick(category.label) : scopeFilter.categoryId;
    if (scopeFilter.mode === "category") {
      return categoryLabel;
    }
    const sub = getSubCategoryItem(scopeFilter.categoryId, scopeFilter.subId);
    const subLabel = sub ? pick(sub.title) : scopeFilter.subId;
    return `${categoryLabel} · ${subLabel}`;
  }, [scopeFilter, registryVersion, pick, t]);

  const typeLabel = useMemo(() => {
    if (typeFilter === "posts") {
      return t("mypage.tabAllPosts");
    }
    if (typeFilter === "comments") {
      return t("mypage.tabComments");
    }
    return t("mypage.tabAll");
  }, [typeFilter, t]);

  if (!user) {
    return null;
  }

  const handleDeleteComment = (commentId: string) => {
    if (!window.confirm(t("social.deleteCommentConfirm"))) {
      return;
    }
    deleteComment(commentId, user.id);
    setComments(getCommentsByAuthorId(user.id));
  };

  const renderCategoryBadge = (categoryId: string, subId: string, post?: Post) => {
    const category = getHomeCategoryById(categoryId);
    const subItem = getSubCategoryItem(categoryId, subId);
    const href = post ? getPostBoardHref(post) : getDefaultCategoryBoardHref(categoryId);
    const label = [
      category ? pick(category.label) : categoryId,
      subItem ? pick(subItem.title) : "",
    ]
      .filter(Boolean)
      .join(" · ");

    return (
      <Link
        href={href}
        className="inline-flex rounded-full bg-white px-2 py-0.5 ring-1 ring-black/[0.05] transition hover:bg-[#06C755]/10 hover:text-[#06C755] hover:ring-[#06C755]/25"
      >
        {label}
      </Link>
    );
  };

  const renderScopeChipLabel = (option: (typeof scopeOptions)[number]) => {
    if (option.scope.mode === "all") {
      return t("mypage.scopeAll");
    }
    const category = option.categoryId
      ? getHomeCategoryById(option.categoryId)
      : undefined;
    const categoryLabel = category
      ? pick(category.label)
      : option.categoryId ?? "";
    if (option.scope.mode === "category") {
      const owned = ownedMenus.find((menu) => menu.id === option.categoryId);
      return (
        <span className="inline-flex items-center gap-1">
          {owned ? (
            <MenuIcon
              icon={owned.icon}
              emojiClassName="text-sm"
              imageClassName="h-4 w-4 rounded object-cover"
            />
          ) : category?.icon ? (
            <span>{category.icon}</span>
          ) : null}
          <span>{categoryLabel}</span>
        </span>
      );
    }
    const sub = option.subId
      ? getSubCategoryItem(option.categoryId!, option.subId)
      : undefined;
    const subLabel = sub ? pick(sub.title) : option.subId;
    return `${categoryLabel} · ${subLabel}`;
  };

  const emptyMessage = () => {
    if (typeFilter === "posts") {
      return t("mypage.myPostsEmpty");
    }
    if (typeFilter === "comments") {
      return t("mypage.myCommentsEmpty");
    }
    if (scopeFilter.mode !== "all") {
      return t("mypage.activityEmptyFiltered");
    }
    return t("mypage.activityEmpty");
  };

  const activeScopeKey = scopeFilterKey(scopeFilter);

  return (
    <FeedSection
      tone="green"
      icon="📋"
      title={t("mypage.communityActivity")}
      description={t("mypage.communityActivityDesc")}
    >
      <div className="mb-3 flex flex-wrap gap-2">
        {typeTabs.map((tab) => (
          <FilterChip
            key={tab.id}
            active={typeFilter === tab.id}
            onClick={() => setTypeFilter(tab.id)}
          >
            {tab.label}
            {tab.count > 0 ? ` (${tab.count})` : ""}
          </FilterChip>
        ))}
      </div>

      {scopeOptions.length > 1 && (
        <div className="mb-4">
          <p className="text-ui-caption mb-2">{t("mypage.filterByCategory")}</p>
          <div className="-mx-1 flex flex-wrap gap-2 px-1 pb-1">
            {scopeOptions.map((option) => {
              const count = countActivityRows(allRows, typeFilter, option.scope);
              const active = activeScopeKey === option.key;
              return (
                <FilterChip
                  key={option.key}
                  active={active}
                  onClick={() => setScopeFilter(option.scope)}
                >
                  {renderScopeChipLabel(option)}
                  {count > 0 ? ` (${count})` : ""}
                </FilterChip>
              );
            })}
          </div>
        </div>
      )}

      {filteredRows.length > 0 && (
        <p className="text-ui-caption mb-3 rounded-xl bg-[#F0F2F5]/80 px-3 py-2 text-sm">
          {t("mypage.filterResult")
            .replace("{type}", typeLabel)
            .replace("{scope}", scopeLabel)
            .replace("{count}", String(filteredRows.length))}
        </p>
      )}

      {scopeFilter.mode !== "all" && (
        <Link
          href={
            scopeFilter.mode === "sub"
              ? `/c/${scopeFilter.categoryId}/${scopeFilter.subId}`
              : getDefaultCategoryBoardHref(scopeFilter.categoryId)
          }
          className="text-ui-caption mb-3 inline-flex text-sm font-semibold text-[#06C755] hover:underline"
        >
          {t("mypage.openBoard")} →
        </Link>
      )}

      {filteredRows.length === 0 ? (
        <p className="text-ui-caption social-zone social-zone--muted rounded-xl px-4 py-6 text-center text-sm">
          {emptyMessage()}
        </p>
      ) : (
        <ul className="space-y-2">
          {filteredRows.map((row) => {
            if (row.kind === "post") {
              const { post } = row;
              const title = post.storeName || post.title;
              return (
                <li key={`post-${post.id}`}>
                  <ListItem>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={getPostBoardHref(post)}
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
                          {renderCategoryBadge(post.categoryId, post.subId, post)}
                          {" · "}
                          {formatPostDate(post.createdAt, locale)}
                        </p>
                        {post.content ? (
                          <p className="text-ui-body mt-2 line-clamp-2 text-sm">
                            {post.content}
                          </p>
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
            }

            const { comment } = row;
            const post = getPostById(comment.postId);
            const postTitle = post
              ? post.storeName || post.title
              : t("mypage.postDeleted");

            return (
              <li key={`comment-${comment.id}`}>
                <ListItem>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      {post ? (
                        <Link
                          href={getPostBoardHref(post)}
                          className="text-ui-chip inline-flex rounded-full bg-[#06C755]/10 px-2.5 py-1 text-xs font-semibold text-[#06C755] hover:underline"
                        >
                          {t("mypage.viewPost")}: {postTitle}
                        </Link>
                      ) : (
                        <p className="text-ui-caption text-xs">{t("mypage.postDeleted")}</p>
                      )}
                      {post ? (
                        <p className="text-ui-caption mt-2">
                          {renderCategoryBadge(post.categoryId, post.subId, post)}
                        </p>
                      ) : null}
                      <p className="text-ui-body mt-2 whitespace-pre-wrap text-sm text-[#050505]">
                        {comment.content}
                      </p>
                      <p className="text-ui-caption mt-2">
                        {formatPostDate(comment.createdAt, locale)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(comment.id)}
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
