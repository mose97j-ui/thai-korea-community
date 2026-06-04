"use client";

import Link from "next/link";
import MenuIcon from "@/components/MenuIcon";
import { useLocale } from "@/contexts/LocaleContext";
import { getHomeCategoryById } from "@/lib/categories/registry";
import { getPostBoardHref } from "@/lib/posts/routes";
import type { CategoryPostStat } from "@/lib/posts/stats";
import type { HotPostItem } from "@/lib/social/types";

export function SidebarCategoryButton({
  categoryId,
  postCount,
  active,
  showRank,
  rank,
  onSelect,
  compact = false,
}: {
  categoryId: string;
  postCount?: number;
  active: boolean;
  showRank?: boolean;
  rank?: number;
  onSelect: (categoryId: string) => void;
  compact?: boolean;
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
      className={`flex w-full items-center gap-3 rounded-xl text-left transition active:scale-[0.98] ${
        compact ? "px-2.5 py-2.5" : "px-3 py-3"
      } ${
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
        className={`flex shrink-0 items-center justify-center overflow-hidden rounded-[14px] ring-1 ring-black/[0.04] ${
          compact ? "h-9 w-9 text-lg" : "h-11 w-11 text-xl"
        } ${category.tint}`}
      >
        <MenuIcon icon={category.icon} emojiClassName={compact ? "text-lg" : "text-xl"} />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`text-ui-chip block line-clamp-2 font-semibold ${
            compact ? "text-sm" : "text-sm sm:text-base"
          } ${active ? "text-[#06C755]" : "text-gray-900"}`}
        >
          {pick(category.label)}
        </span>
        {postCount !== undefined && postCount > 0 ? (
          <span className="mt-0.5 block text-xs text-gray-500 sm:text-sm">
            {t("home.postCount").replace("{count}", String(postCount))}
          </span>
        ) : null}
      </span>
    </button>
  );
}

export function SidebarPostList({
  items,
  variant,
  compact = false,
}: {
  items: HotPostItem[];
  variant: "popular" | "hot";
  compact?: boolean;
}) {
  const { t } = useLocale();

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      {items.map((item, index) => (
        <Link
          key={item.postId}
          href={getPostBoardHref({
            id: item.postId,
            categoryId: item.categoryId,
            subId: item.subId,
          })}
          className={`flex items-start gap-3 rounded-xl ring-1 ring-transparent transition hover:bg-gray-50 active:scale-[0.98] ${
            compact ? "px-2.5 py-2.5" : "px-3 py-3"
          }`}
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
            <span
              className={`text-ui-chip block line-clamp-2 font-semibold text-gray-900 ${
                compact ? "text-sm" : "text-sm sm:text-base"
              }`}
            >
              {item.isSecret ? "🔒 " : ""}
              {item.title}
            </span>
            <span className="mt-0.5 block text-xs text-gray-500 sm:text-sm">
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

export type HomeFeedSidebarData = {
  favoriteIds: string[];
  popular: CategoryPostStat[];
  popularPosts: HotPostItem[];
  hotPosts: HotPostItem[];
  selectedId: string | null;
  onSelect: (categoryId: string) => void;
};
