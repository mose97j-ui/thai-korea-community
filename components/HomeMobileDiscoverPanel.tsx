"use client";

import CollapsibleSection from "@/components/home/CollapsibleSection";
import HomeFeedSidebarContent from "@/components/home/HomeFeedSidebarContent";
import type { HomeFeedSidebarData } from "@/components/home/HomeFeedSidebarParts";
import { useLocale } from "@/contexts/LocaleContext";
import type { HomeSectionCollapseState } from "@/lib/home/sectionCollapse";

type HomeMobileDiscoverPanelProps = HomeFeedSidebarData & {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
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

/** Mobile: same blocks as PC left sidebar — stacked, scrollable, no hidden tabs. */
export default function HomeMobileDiscoverPanel({
  open = true,
  onOpenChange,
  sectionOpens,
  onSectionOpenChange,
  ...props
}: HomeMobileDiscoverPanelProps) {
  const { t } = useLocale();

  return (
    <CollapsibleSection
      className="social-mobile-sidebar lg:hidden"
      title={t("home.mobileSidebarTitle")}
      description={t("home.mobileSidebarDesc")}
      open={open}
      onOpenChange={onOpenChange!}
      bodyClassName="!p-0"
    >
      <div className="social-mobile-sidebar__body social-surface !p-0">
        <HomeFeedSidebarContent
          {...props}
          compact
          divided
          collapsible
          sectionOpens={sectionOpens}
          onSectionOpenChange={onSectionOpenChange}
        />
      </div>
    </CollapsibleSection>
  );
}
