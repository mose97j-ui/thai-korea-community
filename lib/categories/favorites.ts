const FAVORITES_KEY = "tkc_category_favorites";

/** Categories Thai users commonly use — pre-filled on first visit. */
export const DEFAULT_THAI_FAVORITE_CATEGORY_IDS = [
  "jobs",
  "food",
  "reviews",
  "purchase",
  "info",
  "transport",
] as const;

function readAll(): Record<string, string[]> {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, string[]>): void {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(data));
}

export function getCategoryFavorites(userId: string): string[] {
  const all = readAll();
  if (!(userId in all)) {
    const defaults = [...DEFAULT_THAI_FAVORITE_CATEGORY_IDS];
    all[userId] = defaults;
    writeAll(all);
    return defaults;
  }
  return all[userId] ?? [];
}

export function setCategoryFavorites(userId: string, categoryIds: string[]): void {
  const all = readAll();
  all[userId] = categoryIds;
  writeAll(all);
}

export function toggleCategoryFavorite(
  userId: string,
  categoryId: string
): string[] {
  const current = getCategoryFavorites(userId);
  const next = current.includes(categoryId)
    ? current.filter((id) => id !== categoryId)
    : [...current, categoryId];
  setCategoryFavorites(userId, next);
  return next;
}

export function isCategoryFavorite(userId: string, categoryId: string): boolean {
  return getCategoryFavorites(userId).includes(categoryId);
}
