"use client";

import { Card } from "@/components/ui";
import HomeFeedSidebarContent from "@/components/home/HomeFeedSidebarContent";
import type { HomeFeedSidebarData } from "@/components/home/HomeFeedSidebarParts";
import type { HomeSectionCollapseState } from "@/lib/home/sectionCollapse";

type HomeSidebarProps = HomeFeedSidebarData & {
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

export default function HomeSidebar({
  sectionOpens,
  onSectionOpenChange,
  ...props
}: HomeSidebarProps) {
  return (
    <aside className="social-home-sidebar-desktop w-full shrink-0 lg:w-[var(--social-sidebar-width)] lg:min-w-[var(--social-sidebar-width)]">
      <Card className="space-y-5 pr-1">
        <HomeFeedSidebarContent
          {...props}
          collapsible
          sectionOpens={sectionOpens}
          onSectionOpenChange={onSectionOpenChange}
        />
      </Card>
    </aside>
  );
}
