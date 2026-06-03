"use client";

import MenuIcon from "@/components/MenuIcon";
import { useMemo } from "react";
import { Card, SectionLabel } from "@/components/ui";
import { useLocale } from "@/contexts/LocaleContext";
import { getHomeCategoryById } from "@/lib/categories/registry";
import type { CategoryPostStat } from "@/lib/posts/stats";
import { getPostBoardHref } from "@/lib/posts/routes";
import type { HotPostItem } from "@/lib/social/types";
import Link from "next/link";

type HomeSidebarProps = {
  favoriteIds: string[];
  popular: CategoryPostStat[];
  popularPosts: HotPostItem[];
  hotPosts: HotPostItem[];
  selectedId: string | null;
  onSelect: (categoryId: string) => void;
};

function SidebarCategoryButton({
  categoryId,
  postCount,
  active,
  showRank,
  rank,
  onSelect,
}: {
  categoryId: string;
  postCount?: number;
  active: boolean;
  showRank?: boolean;
  rank?: number;
  onSelect: (categoryId: string) => void;
}) {
  const { pick, t } = useLocale();
  const category = getHomeCategoryById(categoryId);
  if (!category) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(categoryId)}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition active:scale-[0.98] ${
        active
          ? "bg-[#06C755]/10 ring-2 ring-[#06C755]"
          : "hover:bg-gray-50 ring-1 ring-transparent"
      }`}
    >
      {showRank && rank !== undefined ? (
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
            rank <= 3 ? "bg-[#06C755] text-white" : "bg-gray-100 text-gray-600"
          }`}
        >
          {rank}
        </span>
      ) : null}
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[14px] text-xl ${category.tint} ring-1 ring-black/[0.04]`}
      >
        <MenuIcon icon={category.icon} emojiClassName="text-xl" />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`text-ui-chip block line-clamp-2 text-sm font-semibold sm:text-base ${
            active ? "text-[#06C755]" : "text-gray-900"
          }`}
        >
          {pick(category.label)}
        </span>
        {postCount !== undefined && postCount > 0 ? (
          <span className="mt-0.5 block text-sm text-gray-500">
            {t("home.postCount").replace("{count}", String(postCount))}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function SidebarPostList({
  items,
  variant,
}: {
  items: HotPostItem[];
  variant: "popular" | "hot";
}) {
  const { t } = useLocale();

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <Link
          key={item.postId}
          href={getPostBoardHref({
            id: item.postId,
            categoryId: item.categoryId,
            subId: item.subId,
          })}
          className="flex items-start gap-3 rounded-xl px-3 py-3 ring-1 ring-transparent transition hover:bg-gray-50 active:scale-[0.98]"
        >
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
              variant === "hot"
                ? index < 3
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-600"
                : index < 3
                  ? "bg-[#06C755] text-white"
                  : "bg-gray-100 text-gray-600"
            }`}
          >
            {variant === "hot" ? "🔥" : index + 1}
          </span>
          <span className="min-w-0 flex-1">
            <span className="text-ui-chip block line-clamp-2 text-sm font-semibold text-gray-900 sm:text-base">
              {item.isSecret ? "🔒 " : ""}
              {item.title}
            </span>
            <span className="mt-0.5 block text-sm text-gray-500">
              {t("social.hotScore")
                .replace("{likes}", String(item.likeCount))
                .replace("{comments}", String(item.commentCount))}
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}

export default function HomeSidebar({
  favoriteIds,
  popular,
  popularPosts,
  hotPosts,
  selectedId,
  onSelect,
}: HomeSidebarProps) {
  const { t } = useLocale();

  const favoriteCategories = useMemo(
    () =>
      favoriteIds
        .map((id) => getHomeCategoryById(id))
        .filter((category): category is NonNullable<typeof category> =>
          Boolean(category)
        ),
    [favoriteIds]
  );

  return (
    <aside className="w-[var(--social-sidebar-width)] min-w-[var(--social-sidebar-width)] shrink-0">
      <Card className="space-y-5 pr-1">
        <div>
          <SectionLabel>{t("home.favorites")}</SectionLabel>
          {favoriteCategories.length > 0 ? (
            <div className="space-y-2">
              {favoriteCategories.map((category) => (
                <SidebarCategoryButton
                  key={category.id}
                  categoryId={category.id}
                  active={selectedId === category.id}
                  onSelect={onSelect}
                />
              ))}
            </div>
          ) : (
            <p className="px-1 text-base leading-relaxed text-gray-500">
              {t("home.favoritesEmpty")}
            </p>
          )}
          <p className="mt-3 px-1 text-sm leading-relaxed text-gray-400">
            {t("home.favoritesHint")}
          </p>
        </div>

        <div className="border-t border-gray-100 pt-5">
          <SectionLabel>{t("home.popular")}</SectionLabel>
          {popular.length > 0 ? (
            <div className="space-y-2">
              {popular.map((item, index) => (
                <SidebarCategoryButton
                  key={item.category.id}
                  categoryId={item.category.id}
                  postCount={item.count}
                  active={selectedId === item.category.id}
                  showRank
                  rank={index + 1}
                  onSelect={onSelect}
                />
              ))}
            </div>
          ) : (
            <p className="px-1 text-base leading-relaxed text-gray-500">
              {t("home.popularEmpty")}
            </p>
          )}
        </div>

        <div className="border-t border-gray-100 pt-5">
          <SectionLabel>{t("home.popularPosts")}</SectionLabel>
          {popularPosts.length > 0 ? (
            <SidebarPostList items={popularPosts} variant="popular" />
          ) : (
            <p className="px-1 text-base leading-relaxed text-gray-500">
              {t("home.popularPostsEmpty")}
            </p>
          )}
        </div>

        <div className="border-t border-gray-100 pt-5">
          <SectionLabel>{t("home.hotBoard")}</SectionLabel>
          {hotPosts.length > 0 ? (
            <SidebarPostList items={hotPosts} variant="hot" />
          ) : (
            <p className="px-1 text-base leading-relaxed text-gray-500">
              {t("home.hotBoardEmpty")}
            </p>
          )}
        </div>
      </Card>
    </aside>
  );
}
