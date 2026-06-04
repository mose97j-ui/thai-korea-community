"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import CollapsibleSection from "@/components/home/CollapsibleSection";
import { SectionLabel } from "@/components/ui";
import {
  SidebarCategoryButton,
  SidebarPostList,
  type HomeFeedSidebarData,
} from "@/components/home/HomeFeedSidebarParts";
import { useLocale } from "@/contexts/LocaleContext";
import { getHomeCategoryById } from "@/lib/categories/registry";
import type { HomeSectionCollapseState } from "@/lib/home/sectionCollapse";

type HomeFeedSidebarContentProps = HomeFeedSidebarData & {
  compact?: boolean;
  /** Mobile stacked layout with dividers between PC sidebar sections. */
  divided?: boolean;
  collapsible?: boolean;
  sectionOpens?: Pick<
    HomeSectionCollapseState,
    "favorites" | "popular" | "popularPosts" | "hotBoard"
  >;
  onSectionOpenChange?: (
    key: keyof Pick<
      HomeSectionCollapseState,
      "favorites" | "popular" | "popularPosts" | "hotBoard"
    >,
    open: boolean
  ) => void;
};

function SectionBlock({
  divided,
  collapsible,
  title,
  open,
  onOpenChange,
  children,
}: {
  divided?: boolean;
  collapsible?: boolean;
  title?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}) {
  if (collapsible && title && onOpenChange && open !== undefined) {
    return (
      <section className={divided ? "border-t border-gray-100 first:border-t-0" : undefined}>
        <CollapsibleSection
          title={title}
          variant="plain"
          open={open}
          onOpenChange={onOpenChange}
          className={divided ? "mx-0" : ""}
          bodyClassName={divided ? "px-3 pb-4 sm:px-4" : "pt-1"}
        >
          {children}
        </CollapsibleSection>
      </section>
    );
  }
  if (divided) {
    return <section className="px-3 py-4 sm:px-4">{children}</section>;
  }
  return <div>{children}</div>;
}

export default function HomeFeedSidebarContent({
  favoriteIds,
  popular,
  popularPosts,
  hotPosts,
  selectedId,
  onSelect,
  compact = false,
  divided = false,
  collapsible = false,
  sectionOpens,
  onSectionOpenChange,
}: HomeFeedSidebarContentProps) {
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

  const dividerBetween = divided ? "border-t border-gray-100" : "border-t border-gray-100 pt-5";

  return (
    <>
      <SectionBlock
        divided={divided}
        collapsible={collapsible}
        title={t("home.favorites")}
        open={sectionOpens?.favorites}
        onOpenChange={(open) => onSectionOpenChange?.("favorites", open)}
      >
        {!collapsible ? <SectionLabel>{t("home.favorites")}</SectionLabel> : null}
        {favoriteCategories.length > 0 ? (
          <div className={compact ? "mt-2 space-y-1.5" : "mt-2 space-y-2"}>
            {favoriteIds.map((id) => (
              <SidebarCategoryButton
                key={id}
                categoryId={id}
                active={selectedId === id}
                onSelect={onSelect}
                compact={compact}
              />
            ))}
          </div>
        ) : (
          <p
            className={`leading-relaxed text-gray-500 ${
              compact ? "mt-2 text-sm" : "mt-2 px-1 text-base"
            }`}
          >
            {t("home.favoritesEmpty")}
          </p>
        )}
        <p
          className={`leading-relaxed text-gray-400 ${
            compact ? "mt-3 text-xs" : "mt-3 px-1 text-sm"
          }`}
        >
          {t("home.favoritesHint")}
        </p>
      </SectionBlock>

      <SectionBlock
        divided={divided}
        collapsible={collapsible}
        title={t("home.popular")}
        open={sectionOpens?.popular}
        onOpenChange={(open) => onSectionOpenChange?.("popular", open)}
      >
        <div className={divided && !collapsible ? undefined : divided ? undefined : dividerBetween}>
          {!collapsible ? <SectionLabel>{t("home.popular")}</SectionLabel> : null}
          {popular.length > 0 ? (
            <div className={compact ? "mt-2 space-y-1.5" : "mt-2 space-y-2"}>
              {popular.map((item, index) => (
                <SidebarCategoryButton
                  key={item.category.id}
                  categoryId={item.category.id}
                  postCount={item.count}
                  active={selectedId === item.category.id}
                  showRank
                  rank={index + 1}
                  onSelect={onSelect}
                  compact={compact}
                />
              ))}
            </div>
          ) : (
            <p
              className={`leading-relaxed text-gray-500 ${
                compact ? "mt-2 text-sm" : "mt-2 px-1 text-base"
              }`}
            >
              {t("home.popularEmpty")}
            </p>
          )}
        </div>
      </SectionBlock>

      <SectionBlock
        divided={divided}
        collapsible={collapsible}
        title={t("home.popularPosts")}
        open={sectionOpens?.popularPosts}
        onOpenChange={(open) => onSectionOpenChange?.("popularPosts", open)}
      >
        <div className={divided && !collapsible ? undefined : divided ? undefined : dividerBetween}>
          {!collapsible ? <SectionLabel>{t("home.popularPosts")}</SectionLabel> : null}
          {popularPosts.length > 0 ? (
            <div className={compact ? "mt-2" : "mt-2"}>
              <SidebarPostList
                items={popularPosts}
                variant="popular"
                compact={compact}
              />
            </div>
          ) : (
            <p
              className={`leading-relaxed text-gray-500 ${
                compact ? "mt-2 text-sm" : "mt-2 px-1 text-base"
              }`}
            >
              {t("home.popularPostsEmpty")}
            </p>
          )}
        </div>
      </SectionBlock>

      <SectionBlock
        divided={divided}
        collapsible={collapsible}
        title={t("home.hotBoard")}
        open={sectionOpens?.hotBoard}
        onOpenChange={(open) => onSectionOpenChange?.("hotBoard", open)}
      >
        <div className={divided && !collapsible ? undefined : divided ? undefined : dividerBetween}>
          {!collapsible ? <SectionLabel>{t("home.hotBoard")}</SectionLabel> : null}
          {hotPosts.length > 0 ? (
            <div className={compact ? "mt-2" : "mt-2"}>
              <SidebarPostList items={hotPosts} variant="hot" compact={compact} />
            </div>
          ) : (
            <p
              className={`leading-relaxed text-gray-500 ${
                compact ? "mt-2 text-sm" : "mt-2 px-1 text-base"
              }`}
            >
              {t("home.hotBoardEmpty")}
            </p>
          )}
        </div>
      </SectionBlock>
    </>
  );
}
