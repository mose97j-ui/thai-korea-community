import {
  homeCategories,
  homeCategoryItems,
  type CategoryItem,
  type HomeSubItem,
} from "@/lib/i18n/content";
import {
  getEffectiveCategorySubItems,
  getEffectiveHomeCategories,
  isCategoryHidden,
} from "./operatorMenus";
import {
  getUserCategories,
  getUserSubCategories,
  isUserCategoryId,
  userCategoryToItem,
  userSubToItem,
} from "./userMenus";

/** Operator menus visible to members (includes web-edited overrides). */
export function getOperatorHomeCategories(): CategoryItem[] {
  return getEffectiveHomeCategories(false);
}

/** Operator menus including hidden — for operator edit UI. */
export function getOperatorHomeCategoriesForEdit(): CategoryItem[] {
  return getEffectiveHomeCategories(true);
}

/** Operator + member-created menus. */
export function getAllHomeCategories(): CategoryItem[] {
  if (typeof window === "undefined") {
    return homeCategories;
  }
  return [...getEffectiveHomeCategories(false), ...getUserCategories().map(userCategoryToItem)];
}

export function getHomeCategoryById(id: string): CategoryItem | undefined {
  if (typeof window !== "undefined") {
    const effective = getEffectiveHomeCategories(true).find((category) => category.id === id);
    if (effective) {
      return effective;
    }
    const userCategory = getUserCategories().find((category) => category.id === id);
    return userCategory ? userCategoryToItem(userCategory) : undefined;
  }
  return homeCategories.find((category) => category.id === id);
}

export function getCategorySubItems(
  categoryId: string,
  includeHidden = false
): HomeSubItem[] {
  if (isUserCategoryId(categoryId)) {
    if (typeof window === "undefined") {
      return [];
    }
    return getUserSubCategories(categoryId).map(userSubToItem);
  }

  if (typeof window === "undefined") {
    return homeCategoryItems[categoryId] ?? [];
  }

  const effective = getEffectiveCategorySubItems(categoryId, includeHidden);
  const userSubs = getUserSubCategories(categoryId).map(userSubToItem);
  return [...effective, ...userSubs];
}

export function getSubCategoryItem(
  categoryId: string,
  subId: string
): HomeSubItem | undefined {
  return getCategorySubItems(categoryId, true).find((item) => item.id === subId);
}

export function getMergedHomeCategoryItems(): Record<string, HomeSubItem[]> {
  const merged: Record<string, HomeSubItem[]> = { ...homeCategoryItems };
  if (typeof window === "undefined") {
    return merged;
  }
  for (const category of getEffectiveHomeCategories(true)) {
    merged[category.id] = getCategorySubItems(category.id, true);
  }
  for (const category of getUserCategories()) {
    merged[category.id] = getCategorySubItems(category.id, true);
  }
  return merged;
}

export function isPremiumCategoryId(categoryId: string): boolean {
  const category = getHomeCategoryById(categoryId);
  return Boolean(category?.premium);
}

export { isCategoryHidden };
