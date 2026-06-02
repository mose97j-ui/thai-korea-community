import { getAllHomeCategories } from "@/lib/categories/registry";
import type { CategoryItem } from "@/lib/i18n/content";

const POSTS_KEY = "tkc_posts";

export type CategoryPostStat = {
  category: CategoryItem;
  count: number;
};

function readPostCategoryCounts(): Map<string, number> {
  if (typeof window === "undefined") {
    return new Map();
  }

  try {
    const raw = localStorage.getItem(POSTS_KEY);
    if (!raw) {
      return new Map();
    }

    const posts = JSON.parse(raw) as { categoryId?: string }[];
    const map = new Map<string, number>();

    for (const post of posts) {
      const categoryId = post.categoryId?.trim();
      if (!categoryId) {
        continue;
      }
      map.set(categoryId, (map.get(categoryId) ?? 0) + 1);
    }

    return map;
  } catch {
    return new Map();
  }
}

export function getCategoryPostStats(): CategoryPostStat[] {
  const counts = readPostCategoryCounts();

  return getAllHomeCategories()
    .map((category) => ({
      category,
      count: counts.get(category.id) ?? 0,
    }))
    .sort((a, b) => b.count - a.count || a.category.id.localeCompare(b.category.id));
}

export function getPopularCategories(limit = 6): CategoryPostStat[] {
  const stats = getCategoryPostStats().filter((item) => item.count > 0);
  return stats.slice(0, limit);
}
