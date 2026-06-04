import { getCategoryOverviewHref } from "@/lib/i18n/content";
import { getCategorySubItems } from "@/lib/categories/registry";

/** First sub-board for a category, or category overview. */
export function getDefaultCategoryBoardHref(categoryId: string): string {
  const subs = getCategorySubItems(categoryId);
  if (subs.length > 0) {
    return subs[0].href;
  }
  return getCategoryOverviewHref(categoryId);
}
