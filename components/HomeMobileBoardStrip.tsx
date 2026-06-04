"use client";

import MenuIcon from "@/components/MenuIcon";
import CollapsibleSection from "@/components/home/CollapsibleSection";
import { useMemo } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { getHomeCategoryById } from "@/lib/categories/registry";
import type { CategoryPostStat } from "@/lib/posts/stats";

type HomeMobileBoardStripProps = {
  favoriteIds: string[];
  popular: CategoryPostStat[];
  selectedId: string | null;
  onSelect: (categoryId: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export default function HomeMobileBoardStrip({
  favoriteIds,
  popular,
  selectedId,
  onSelect,
  open = true,
  onOpenChange,
}: HomeMobileBoardStripProps) {
  const { t, pick } = useLocale();

  const chips = useMemo(() => {
    const seen = new Set<string>();
    const items: { id: string; label: string; icon: string; tint: string; count?: number }[] =
      [];

    for (const id of favoriteIds) {
      const category = getHomeCategoryById(id);
      if (!category || seen.has(id)) {
        continue;
      }
      seen.add(id);
      items.push({
        id,
        label: pick(category.label),
        icon: category.icon,
        tint: category.tint,
      });
    }

    for (const stat of popular.slice(0, 6)) {
      const category = getHomeCategoryById(stat.category.id);
      if (!category || seen.has(stat.category.id)) {
        continue;
      }
      seen.add(stat.category.id);
      items.push({
        id: stat.category.id,
        label: pick(category.label),
        icon: category.icon,
        tint: category.tint,
        count: stat.count,
      });
    }

    return items;
  }, [favoriteIds, popular, pick]);

  if (chips.length === 0) {
    return null;
  }

  return (
    <CollapsibleSection
      className="social-mobile-board-strip lg:hidden"
      title={t("home.mobileBoards")}
      open={open}
      onOpenChange={onOpenChange!}
      bodyClassName="!px-0 !pt-0"
    >
      <div className="social-mobile-board-scroll px-3 pb-1">
        {chips.map((chip) => {
          const active = selectedId === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => onSelect(chip.id)}
              className={`social-mobile-board-chip ${active ? "social-mobile-board-chip--active" : ""}`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-base ${chip.tint}`}
              >
                <MenuIcon icon={chip.icon} emojiClassName="text-base" />
              </span>
              <span className="min-w-0 truncate text-xs font-semibold leading-tight">
                {chip.label}
              </span>
              {chip.count !== undefined && chip.count > 0 ? (
                <span className="text-[10px] font-medium text-gray-500">{chip.count}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </CollapsibleSection>
  );
}
