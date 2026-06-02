import type { CategoryItem, HomeSubItem } from "@/lib/i18n/content";
import type { LocalizedText } from "@/lib/i18n/types";
import type { MessageKey } from "@/lib/i18n/messages";
import type { PostFormTemplateId } from "@/lib/posts/formTemplateTypes";
import { DEFAULT_SUB_DESCRIPTION_TH } from "./menuIconMatch";
import { normalizeMenuIcon, validateMenuIconImagePolicy } from "./menuIcon";
import { thaiOnlyLocalized } from "./operatorMenus";
import { DEFAULT_MENU_TINT } from "./tintPresets";

export const USER_CATEGORY_ID_PREFIX = "ucat-";
export const USER_MENUS_CHANGE_EVENT = "tkc-user-menus-change";

const STORAGE_KEY = "tkc_user_menus";

export type StoredUserCategory = {
  id: string;
  creatorId: string;
  creatorNickname: string;
  label: LocalizedText;
  icon: string;
  tint: string;
  formTemplate: PostFormTemplateId;
  createdAt: string;
};

export type StoredUserSubCategory = {
  id: string;
  categoryId: string;
  title: LocalizedText;
  description: LocalizedText;
  icon: string;
  tint: string;
  createdAt: string;
};

type UserMenuStore = {
  categories: StoredUserCategory[];
  subcategories: StoredUserSubCategory[];
};

function emptyStore(): UserMenuStore {
  return { categories: [], subcategories: [] };
}

function notifyChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(USER_MENUS_CHANGE_EVENT));
  }
}

function readStore(): UserMenuStore {
  if (typeof window === "undefined") {
    return emptyStore();
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return emptyStore();
    }
    const parsed = JSON.parse(raw) as UserMenuStore;
    return {
      categories: parsed.categories ?? [],
      subcategories: parsed.subcategories ?? [],
    };
  } catch {
    return emptyStore();
  }
}

function writeStore(store: UserMenuStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  notifyChange();
}

export function isUserCategoryId(categoryId: string): boolean {
  return categoryId.startsWith(USER_CATEGORY_ID_PREFIX);
}

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
  }
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function normalizeEmoji(value: string): string {
  return normalizeMenuIcon(value);
}

function normalizeTint(value: string | undefined): string {
  const trimmed = value?.trim();
  return trimmed || DEFAULT_MENU_TINT;
}

export function getUserCategories(): StoredUserCategory[] {
  return readStore().categories.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function getUserSubCategories(categoryId: string): StoredUserSubCategory[] {
  return readStore()
    .subcategories.filter((item) => item.categoryId === categoryId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function getUserCategoryById(categoryId: string): StoredUserCategory | undefined {
  return getUserCategories().find((item) => item.id === categoryId);
}

export function getUserSubCategoryById(
  categoryId: string,
  subId: string
): StoredUserSubCategory | undefined {
  return getUserSubCategories(categoryId).find((item) => item.id === subId);
}

export function userCategoryToItem(category: StoredUserCategory): CategoryItem {
  const firstSub = getUserSubCategories(category.id)[0];
  return {
    id: category.id,
    label: category.label,
    icon: category.icon,
    tint: category.tint,
    href: firstSub ? `/c/${category.id}/${firstSub.id}` : `/c/${category.id}`,
  };
}

export function userSubToItem(sub: StoredUserSubCategory): HomeSubItem {
  return {
    id: sub.id,
    title: sub.title,
    description: sub.description,
    icon: sub.icon,
    tint: sub.tint,
    href: `/c/${sub.categoryId}/${sub.id}`,
  };
}

export type CreateUserCategoryInput = {
  creatorId: string;
  creatorNickname: string;
  label: string;
  icon: string;
  tint?: string;
  formTemplate: PostFormTemplateId;
  iconImagePolicyAccepted?: boolean;
  subcategories: { title: string; description: string; icon: string }[];
};

export type CreateUserSubCategoryInput = {
  categoryId: string;
  creatorId: string;
  title: string;
  description?: string;
  icon: string;
  tint?: string;
};

export type UserMenuMutationResult =
  | { ok: true; categoryId: string; subId?: string }
  | { ok: false; errorKey: MessageKey };

export function createUserCategory(
  input: CreateUserCategoryInput
): UserMenuMutationResult {
  const label = input.label.trim();
  const subs = (input.subcategories ?? []).filter((sub) => sub.title.trim());

  if (!label) {
    return { ok: false, errorKey: "operatorMenu.errorThaiLabel" };
  }
  if (subs.length === 0) {
    return { ok: false, errorKey: "operatorMenu.errorThaiSubTitle" };
  }
  if (!input.creatorId.trim()) {
    return { ok: false, errorKey: "userMenu.errorLoginRequired" };
  }
  const policy = validateMenuIconImagePolicy(input.icon, input.iconImagePolicyAccepted);
  if (!policy.ok) {
    return policy;
  }

  const store = readStore();
  const categoryId = createId(USER_CATEGORY_ID_PREFIX);
  const now = new Date().toISOString();
  const localized = thaiOnlyLocalized(label);

  store.categories.push({
    id: categoryId,
    creatorId: input.creatorId,
    creatorNickname: input.creatorNickname.trim() || "Member",
    label: localized,
    icon: normalizeEmoji(input.icon) || "📌",
    tint: normalizeTint(input.tint),
    formTemplate: input.formTemplate,
    createdAt: now,
  });

  let subIndex = 0;
  let firstSubId: string | undefined;
  for (const sub of subs) {
    const subId = `${categoryId}-${subIndex}`;
    subIndex += 1;
    if (!firstSubId) {
      firstSubId = subId;
    }
    store.subcategories.push({
      id: subId,
      categoryId,
      title: thaiOnlyLocalized(sub.title),
      description: thaiOnlyLocalized(sub.description?.trim() || DEFAULT_SUB_DESCRIPTION_TH),
      icon: normalizeEmoji(sub.icon) || normalizeEmoji(input.icon) || "📌",
      tint: normalizeTint(input.tint),
      createdAt: now,
    });
  }

  writeStore(store);
  return { ok: true, categoryId, subId: firstSubId };
}

export function createUserSubCategory(
  input: CreateUserSubCategoryInput
): UserMenuMutationResult {
  const category = getUserCategoryById(input.categoryId);
  if (!category) {
    return { ok: false, errorKey: "userMenu.errorCategoryNotFound" };
  }
  if (category.creatorId !== input.creatorId) {
    return { ok: false, errorKey: "userMenu.errorNotOwner" };
  }

  const title = input.title.trim();
  if (!title) {
    return { ok: false, errorKey: "operatorMenu.errorThaiSubTitle" };
  }

  const store = readStore();
  const existing = store.subcategories.filter((item) => item.categoryId === input.categoryId);
  const subId = `${input.categoryId}-${existing.length}`;
  const now = new Date().toISOString();

  store.subcategories.push({
    id: subId,
    categoryId: input.categoryId,
    title: thaiOnlyLocalized(title),
    description: thaiOnlyLocalized(input.description?.trim() || DEFAULT_SUB_DESCRIPTION_TH),
    icon: normalizeEmoji(input.icon) || category.icon,
    tint: normalizeTint(input.tint ?? category.tint),
    createdAt: now,
  });

  writeStore(store);
  return { ok: true, categoryId: input.categoryId, subId };
}

export function deleteUserCategory(
  categoryId: string,
  userId: string
): UserMenuMutationResult {
  const category = getUserCategoryById(categoryId);
  if (!category) {
    return { ok: false, errorKey: "userMenu.errorCategoryNotFound" };
  }
  if (category.creatorId !== userId) {
    return { ok: false, errorKey: "userMenu.errorNotOwner" };
  }

  const store = readStore();
  store.categories = store.categories.filter((item) => item.id !== categoryId);
  store.subcategories = store.subcategories.filter((item) => item.categoryId !== categoryId);
  writeStore(store);
  return { ok: true, categoryId };
}

export function getUserCategoriesByCreator(userId: string): StoredUserCategory[] {
  return getUserCategories().filter((item) => item.creatorId === userId);
}
