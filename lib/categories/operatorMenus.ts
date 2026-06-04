import {
  homeCategories,
  homeCategoryItems,
  type CategoryItem,
  type HomeSubItem,
} from "@/lib/i18n/content";
import type { LocalizedText } from "@/lib/i18n/types";
import type { MessageKey } from "@/lib/i18n/messages";
import type { PostFormTemplateId } from "@/lib/posts/formTemplateTypes";
import { DEFAULT_MENU_TINT } from "./tintPresets";
import { DEFAULT_SUB_DESCRIPTION_TH } from "./menuIconMatch";
import { mergeGroupOrder, reorderIds } from "@/lib/arrayMove";
import { isMenuIconImage, normalizeMenuIcon, validateMenuIconImagePolicy } from "./menuIcon";

export function thaiOnlyLocalized(text: string): LocalizedText {
  const th = text.trim();
  return { th, ko: th };
}

export const OPERATOR_CATEGORY_ID_PREFIX = "opcat-";
export const OPERATOR_MENUS_CHANGE_EVENT = "tkc-operator-menus-change";

const STORAGE_KEY = "tkc_operator_menus";
export const OPERATOR_MENUS_SYNCED_AT_KEY = "tkc_operator_menus_synced_at";

export type CategoryOverride = {
  label?: LocalizedText;
  icon?: string;
  tint?: string;
  hidden?: boolean;
  premium?: boolean;
};

export type SubCategoryOverride = {
  title?: LocalizedText;
  description?: LocalizedText;
  icon?: string;
  tint?: string;
  hidden?: boolean;
};

export type StoredOperatorCategory = {
  id: string;
  label: LocalizedText;
  icon: string;
  tint: string;
  formTemplate: PostFormTemplateId;
  premium?: boolean;
  hidden?: boolean;
  createdAt: string;
};

export type StoredOperatorSubCategory = {
  id: string;
  categoryId: string;
  title: LocalizedText;
  description: LocalizedText;
  icon: string;
  tint: string;
  hidden?: boolean;
  createdAt: string;
};

export type OperatorMenuStore = {
  categoryOverrides: Record<string, CategoryOverride>;
  subcategoryOverrides: Record<string, SubCategoryOverride>;
  addedCategories: StoredOperatorCategory[];
  addedSubcategories: StoredOperatorSubCategory[];
  categoryOrder?: string[];
  subcategoryOrder?: Record<string, string[]>;
};

function emptyStore(): OperatorMenuStore {
  return {
    categoryOverrides: {},
    subcategoryOverrides: {},
    addedCategories: [],
    addedSubcategories: [],
    categoryOrder: [],
    subcategoryOrder: {},
  };
}

function getDefaultCategoryOrder(store: OperatorMenuStore): string[] {
  return [
    ...homeCategories.map((category) => category.id),
    ...store.addedCategories.map((category) => category.id),
  ];
}

function normalizeCategoryOrder(store: OperatorMenuStore): string[] {
  const validIds = new Set(getDefaultCategoryOrder(store));
  const stored = store.categoryOrder ?? [];
  const ordered: string[] = [];
  const seen = new Set<string>();

  for (const categoryId of stored) {
    if (validIds.has(categoryId) && !seen.has(categoryId)) {
      ordered.push(categoryId);
      seen.add(categoryId);
    }
  }

  for (const categoryId of getDefaultCategoryOrder(store)) {
    if (!seen.has(categoryId)) {
      ordered.push(categoryId);
    }
  }

  return ordered;
}

function applyCategoryOrder(categories: CategoryItem[], order: string[]): CategoryItem[] {
  return applyItemOrder(categories, order);
}

function applyItemOrder<T extends { id: string }>(items: T[], order: string[]): T[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  const ordered: T[] = [];
  const seen = new Set<string>();

  for (const id of order) {
    const item = byId.get(id);
    if (item) {
      ordered.push(item);
      seen.add(id);
    }
  }

  for (const item of items) {
    if (!seen.has(item.id)) {
      ordered.push(item);
    }
  }

  return ordered;
}

function getDefaultSubCategoryOrder(store: OperatorMenuStore, categoryId: string): string[] {
  const base = homeCategoryItems[categoryId]?.map((item) => item.id) ?? [];
  const added = store.addedSubcategories
    .filter((item) => item.categoryId === categoryId)
    .map((item) => item.id);
  return [...base, ...added];
}

function normalizeSubCategoryOrder(store: OperatorMenuStore, categoryId: string): string[] {
  const validIds = new Set(getDefaultSubCategoryOrder(store, categoryId));
  const stored = store.subcategoryOrder?.[categoryId] ?? [];
  const ordered: string[] = [];
  const seen = new Set<string>();

  for (const subId of stored) {
    if (validIds.has(subId) && !seen.has(subId)) {
      ordered.push(subId);
      seen.add(subId);
    }
  }

  for (const subId of getDefaultSubCategoryOrder(store, categoryId)) {
    if (!seen.has(subId)) {
      ordered.push(subId);
    }
  }

  return ordered;
}

function appendSubCategoryOrder(
  store: OperatorMenuStore,
  categoryId: string,
  subId: string
): void {
  const order = normalizeSubCategoryOrder(store, categoryId);
  if (!order.includes(subId)) {
    store.subcategoryOrder = {
      ...store.subcategoryOrder,
      [categoryId]: [...order, subId],
    };
  }
}

function removeSubCategoryOrder(store: OperatorMenuStore, categoryId: string, subId: string): void {
  const order = normalizeSubCategoryOrder(store, categoryId).filter((id) => id !== subId);
  store.subcategoryOrder = {
    ...store.subcategoryOrder,
    [categoryId]: order,
  };
}

function notifyChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(OPERATOR_MENUS_CHANGE_EVENT));
  }
}

function scheduleOperatorMenuServerSync(): void {
  if (typeof window === "undefined") {
    return;
  }
  void import("./operatorMenuSync").then((mod) => mod.scheduleOperatorMenuSync());
}

/** Read persisted operator menu store (not edit-session draft). */
export function getPersistedOperatorMenuStore(): OperatorMenuStore {
  return readPersistedStore();
}

export function getOperatorMenuSyncedAt(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(OPERATOR_MENUS_SYNCED_AT_KEY);
}

export function markOperatorMenuSyncedAt(updatedAt: string): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(OPERATOR_MENUS_SYNCED_AT_KEY, updatedAt);
}

/** Apply server menu config locally and refresh all listeners. */
export function applyRemoteOperatorMenuStore(
  store: OperatorMenuStore,
  updatedAt: string
): boolean {
  if (typeof window === "undefined" || isOperatorMenuEditSessionActive()) {
    return false;
  }

  const serialized = JSON.stringify(store);
  const existing = localStorage.getItem(STORAGE_KEY);
  markOperatorMenuSyncedAt(updatedAt);

  if (existing === serialized) {
    return false;
  }

  localStorage.setItem(STORAGE_KEY, serialized);
  notifyChange();
  return true;
}

let editSessionStore: OperatorMenuStore | null = null;

function readPersistedStore(): OperatorMenuStore {
  if (typeof window === "undefined") {
    return emptyStore();
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return emptyStore();
    }
    const parsed = JSON.parse(raw) as OperatorMenuStore;
    return {
      categoryOverrides: parsed.categoryOverrides ?? {},
      subcategoryOverrides: parsed.subcategoryOverrides ?? {},
      addedCategories: parsed.addedCategories ?? [],
      addedSubcategories: parsed.addedSubcategories ?? [],
      categoryOrder: parsed.categoryOrder ?? [],
      subcategoryOrder: parsed.subcategoryOrder ?? {},
    };
  } catch {
    return emptyStore();
  }
}

function readStore(): OperatorMenuStore {
  if (typeof window === "undefined") {
    return emptyStore();
  }
  if (editSessionStore) {
    return editSessionStore;
  }
  return readPersistedStore();
}

function writeStore(store: OperatorMenuStore): void {
  if (typeof window === "undefined") {
    return;
  }
  if (editSessionStore) {
    editSessionStore = store;
    notifyChange();
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  notifyChange();
  scheduleOperatorMenuServerSync();
}

export function beginOperatorMenuEditSession(): void {
  if (typeof window === "undefined") {
    return;
  }
  editSessionStore = JSON.parse(JSON.stringify(readPersistedStore())) as OperatorMenuStore;
  notifyChange();
}

export function commitOperatorMenuEditSession(): void {
  if (typeof window === "undefined" || !editSessionStore) {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(editSessionStore));
  editSessionStore = null;
  notifyChange();
  scheduleOperatorMenuServerSync();
}

export function cancelOperatorMenuEditSession(): void {
  editSessionStore = null;
  notifyChange();
}

export function isOperatorMenuEditSessionActive(): boolean {
  return editSessionStore !== null;
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

export function isOperatorCategoryId(categoryId: string): boolean {
  return categoryId.startsWith(OPERATOR_CATEGORY_ID_PREFIX);
}

export function isBuiltInCategoryId(categoryId: string): boolean {
  return homeCategories.some((category) => category.id === categoryId);
}

function applyCategoryOverride(
  base: CategoryItem,
  override?: CategoryOverride
): CategoryItem {
  if (!override) {
    return base;
  }
  return {
    ...base,
    label: override.label ?? base.label,
    icon: override.icon ?? base.icon,
    tint: override.tint ?? base.tint,
    premium: override.premium ?? base.premium,
  };
}

function applySubOverride(base: HomeSubItem, override?: SubCategoryOverride): HomeSubItem {
  if (!override) {
    return base;
  }
  return {
    ...base,
    title: override.title ?? base.title,
    description: override.description ?? base.description,
    icon: override.icon ?? base.icon,
    tint: override.tint ?? base.tint,
  };
}

export function operatorSubToItem(sub: StoredOperatorSubCategory): HomeSubItem {
  return {
    id: sub.id,
    title: sub.title,
    description: sub.description,
    icon: sub.icon,
    tint: sub.tint,
    href: `/c/${sub.categoryId}/${sub.id}`,
  };
}

function operatorCategoryToItem(
  category: StoredOperatorCategory,
  subs: HomeSubItem[]
): CategoryItem {
  const firstSub = subs[0];
  return {
    id: category.id,
    label: category.label,
    icon: category.icon,
    tint: category.tint,
    premium: category.premium,
    href: firstSub ? `/c/${category.id}/${firstSub.id}` : `/c/${category.id}`,
  };
}

export function isCategoryHidden(categoryId: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const store = readStore();
  const added = store.addedCategories.find((item) => item.id === categoryId);
  if (added) {
    return Boolean(added.hidden);
  }
  return Boolean(store.categoryOverrides[categoryId]?.hidden);
}

export function isSubCategoryHidden(subId: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const store = readStore();
  const added = store.addedSubcategories.find((item) => item.id === subId);
  if (added) {
    return Boolean(added.hidden);
  }
  return Boolean(store.subcategoryOverrides[subId]?.hidden);
}

export function getEffectiveCategorySubItems(
  categoryId: string,
  includeHidden = false
): HomeSubItem[] {
  const base = homeCategoryItems[categoryId] ?? [];
  if (typeof window === "undefined") {
    return base;
  }

  const store = readStore();
  const mergedBase = base
    .map((item) => applySubOverride(item, store.subcategoryOverrides[item.id]))
    .filter((item) => includeHidden || !isSubCategoryHidden(item.id));

  const added = store.addedSubcategories
    .filter((item) => item.categoryId === categoryId)
    .filter((item) => includeHidden || !item.hidden)
    .map(operatorSubToItem);

  const merged = [...mergedBase, ...added];
  return applyItemOrder(merged, normalizeSubCategoryOrder(store, categoryId));
}

export function getEffectiveHomeCategories(includeHidden = false): CategoryItem[] {
  if (typeof window === "undefined") {
    return homeCategories;
  }

  const store = readStore();
  const builtIn = homeCategories
    .map((category) => {
      const override = store.categoryOverrides[category.id];
      if (!includeHidden && override?.hidden) {
        return null;
      }
      return applyCategoryOverride(category, override);
    })
    .filter((category): category is CategoryItem => category !== null);

  const added = store.addedCategories
    .filter((category) => includeHidden || !category.hidden)
    .map((category) => {
      const subs = getEffectiveCategorySubItems(category.id, includeHidden);
      return operatorCategoryToItem(category, subs);
    });

  const merged = [...builtIn, ...added];
  return applyCategoryOrder(merged, normalizeCategoryOrder(store));
}

export function getOperatorCategoryOrder(): string[] {
  const store = readStore();
  return normalizeCategoryOrder(store);
}

export function reorderCategoriesInGroup(
  groupCategoryIds: string[],
  activeId: string,
  overId: string
): OperatorMenuMutationResult {
  const store = readStore();
  const fullOrder = normalizeCategoryOrder(store);
  const groupSet = new Set(groupCategoryIds);
  const groupOrdered = fullOrder.filter((id) => groupSet.has(id));
  const newGroupOrder = reorderIds(groupOrdered, activeId, overId);
  store.categoryOrder = mergeGroupOrder(fullOrder, groupCategoryIds, newGroupOrder);
  writeStore(store);
  return { ok: true, categoryId: activeId };
}

export function setCategoryGroupOrder(
  groupCategoryIds: string[],
  newGroupOrder: string[]
): OperatorMenuMutationResult {
  const store = readStore();
  const fullOrder = normalizeCategoryOrder(store);
  store.categoryOrder = mergeGroupOrder(fullOrder, groupCategoryIds, newGroupOrder);
  writeStore(store);
  return { ok: true };
}

export function setSubCategoryGroupOrder(
  categoryId: string,
  groupSubIds: string[],
  newGroupOrder: string[]
): OperatorMenuMutationResult {
  const store = readStore();
  const fullOrder = normalizeSubCategoryOrder(store, categoryId);
  store.subcategoryOrder = {
    ...store.subcategoryOrder,
    [categoryId]: mergeGroupOrder(fullOrder, groupSubIds, newGroupOrder),
  };
  writeStore(store);
  return { ok: true, categoryId };
}

export function reorderSubCategoriesInGroup(
  categoryId: string,
  groupSubIds: string[],
  activeId: string,
  overId: string
): OperatorMenuMutationResult {
  const store = readStore();
  const fullOrder = normalizeSubCategoryOrder(store, categoryId);
  const groupSet = new Set(groupSubIds);
  const groupOrdered = fullOrder.filter((id) => groupSet.has(id));
  const newGroupOrder = reorderIds(groupOrdered, activeId, overId);
  store.subcategoryOrder = {
    ...store.subcategoryOrder,
    [categoryId]: mergeGroupOrder(fullOrder, groupSubIds, newGroupOrder),
  };
  writeStore(store);
  return { ok: true, subId: activeId, categoryId };
}

export function getOperatorCategoryById(
  categoryId: string
): StoredOperatorCategory | undefined {
  return readStore().addedCategories.find((item) => item.id === categoryId);
}

export function getCategoryOverride(categoryId: string): CategoryOverride | undefined {
  return readStore().categoryOverrides[categoryId];
}

export function getSubCategoryOverride(subId: string): SubCategoryOverride | undefined {
  return readStore().subcategoryOverrides[subId];
}

export function getOperatorSubCategoryById(
  subId: string
): StoredOperatorSubCategory | undefined {
  return readStore().addedSubcategories.find((item) => item.id === subId);
}

function nextSubId(categoryId: string): string {
  const existing = getEffectiveCategorySubItems(categoryId, true);
  const indices = existing.map((item) => {
    const match = item.id.match(/-(\d+)$/);
    return match ? Number.parseInt(match[1], 10) : 0;
  });
  const next = indices.length > 0 ? Math.max(...indices) + 1 : 0;
  return `${categoryId}-${next}`;
}

export type OperatorMenuMutationResult =
  | { ok: true; categoryId?: string; subId?: string }
  | { ok: false; errorKey: MessageKey };

export type UpdateCategoryInput = {
  categoryId: string;
  /** Thai menu name (stored for both th/ko display). */
  label: string;
  icon: string;
  tint?: string;
  premium?: boolean;
  iconImagePolicyAccepted?: boolean;
};

export function updateBuiltInCategory(input: UpdateCategoryInput): OperatorMenuMutationResult {
  const label = input.label.trim();
  if (!label) {
    return { ok: false, errorKey: "operatorMenu.errorThaiLabel" };
  }
  if (!isBuiltInCategoryId(input.categoryId)) {
    return { ok: false, errorKey: "operatorMenu.errorCategoryNotFound" };
  }
  const policy = validateMenuIconImagePolicy(input.icon, input.iconImagePolicyAccepted);
  if (!policy.ok) {
    return policy;
  }

  const store = readStore();
  store.categoryOverrides[input.categoryId] = {
    ...store.categoryOverrides[input.categoryId],
    label: thaiOnlyLocalized(label),
    icon: normalizeEmoji(input.icon) || "📌",
    tint: normalizeTint(input.tint),
    premium: input.premium,
  };
  writeStore(store);
  return { ok: true, categoryId: input.categoryId };
}

export function setCategoryHidden(
  categoryId: string,
  hidden: boolean
): OperatorMenuMutationResult {
  const store = readStore();
  const added = store.addedCategories.find((item) => item.id === categoryId);
  if (added) {
    added.hidden = hidden;
    writeStore(store);
    return { ok: true, categoryId };
  }
  if (!isBuiltInCategoryId(categoryId) && !isOperatorCategoryId(categoryId)) {
    return { ok: false, errorKey: "operatorMenu.errorCategoryNotFound" };
  }
  store.categoryOverrides[categoryId] = {
    ...store.categoryOverrides[categoryId],
    hidden,
  };
  writeStore(store);
  return { ok: true, categoryId };
}

export type CreateOperatorCategoryInput = {
  label: string;
  icon: string;
  tint?: string;
  formTemplate: PostFormTemplateId;
  premium?: boolean;
  iconImagePolicyAccepted?: boolean;
  subcategories?: {
    title: string;
    description?: string;
    icon?: string;
  }[];
};

export function createOperatorCategory(
  input: CreateOperatorCategoryInput
): OperatorMenuMutationResult {
  const label = input.label.trim();
  if (!label) {
    return { ok: false, errorKey: "operatorMenu.errorThaiLabel" };
  }
  const policy = validateMenuIconImagePolicy(input.icon, input.iconImagePolicyAccepted);
  if (!policy.ok) {
    return policy;
  }

  const store = readStore();
  const categoryId = createId(OPERATOR_CATEGORY_ID_PREFIX);
  const now = new Date().toISOString();
  const localized = thaiOnlyLocalized(label);

  store.addedCategories.push({
    id: categoryId,
    label: localized,
    icon: normalizeEmoji(input.icon) || "📌",
    tint: normalizeTint(input.tint),
    formTemplate: input.formTemplate,
    premium: input.premium,
    createdAt: now,
  });
  store.categoryOrder = [...normalizeCategoryOrder(store), categoryId];

  let subIndex = 0;
  let firstSubId: string | undefined;
  for (const sub of input.subcategories ?? []) {
    const title = sub.title.trim();
    if (!title) {
      continue;
    }
    const subId = `${categoryId}-${subIndex}`;
    subIndex += 1;
    if (!firstSubId) {
      firstSubId = subId;
    }
    store.addedSubcategories.push({
      id: subId,
      categoryId,
      title: thaiOnlyLocalized(title),
      description: thaiOnlyLocalized(sub.description?.trim() || DEFAULT_SUB_DESCRIPTION_TH),
      icon: normalizeEmoji(sub.icon ?? input.icon) || "📌",
      tint: normalizeTint(input.tint),
      createdAt: now,
    });
    appendSubCategoryOrder(store, categoryId, subId);
  }

  writeStore(store);
  return { ok: true, categoryId, subId: firstSubId };
}

export function updateOperatorCategory(
  categoryId: string,
  input: Omit<UpdateCategoryInput, "categoryId"> & { formTemplate?: PostFormTemplateId }
): OperatorMenuMutationResult {
  const category = getOperatorCategoryById(categoryId);
  if (!category) {
    return { ok: false, errorKey: "operatorMenu.errorCategoryNotFound" };
  }
  const label = input.label.trim();
  if (!label) {
    return { ok: false, errorKey: "operatorMenu.errorThaiLabel" };
  }
  const policy = validateMenuIconImagePolicy(input.icon, input.iconImagePolicyAccepted);
  if (!policy.ok) {
    return policy;
  }

  const store = readStore();
  const target = store.addedCategories.find((item) => item.id === categoryId);
  if (!target) {
    return { ok: false, errorKey: "operatorMenu.errorCategoryNotFound" };
  }

  target.label = thaiOnlyLocalized(label);
  target.icon = normalizeEmoji(input.icon) || "📌";
  target.tint = normalizeTint(input.tint);
  target.premium = input.premium;
  if (input.formTemplate) {
    target.formTemplate = input.formTemplate;
  }

  writeStore(store);
  return { ok: true, categoryId };
}

export function deleteOperatorCategory(categoryId: string): OperatorMenuMutationResult {
  if (!isOperatorCategoryId(categoryId)) {
    return { ok: false, errorKey: "operatorMenu.errorBuiltInDelete" };
  }
  const store = readStore();
  store.addedCategories = store.addedCategories.filter((item) => item.id !== categoryId);
  store.addedSubcategories = store.addedSubcategories.filter(
    (item) => item.categoryId !== categoryId
  );
  store.categoryOrder = normalizeCategoryOrder(store).filter((id) => id !== categoryId);
  if (store.subcategoryOrder?.[categoryId]) {
    const nextSubcategoryOrder = { ...store.subcategoryOrder };
    delete nextSubcategoryOrder[categoryId];
    store.subcategoryOrder = nextSubcategoryOrder;
  }
  writeStore(store);
  return { ok: true, categoryId };
}

export type UpdateSubCategoryInput = {
  subId: string;
  categoryId: string;
  title: string;
  description: string;
  icon: string;
  tint?: string;
};

export function updateSubCategory(input: UpdateSubCategoryInput): OperatorMenuMutationResult {
  const title = input.title.trim();
  if (!title) {
    return { ok: false, errorKey: "operatorMenu.errorThaiSubTitle" };
  }

  const description = input.description.trim() || DEFAULT_SUB_DESCRIPTION_TH;
  const localizedTitle = thaiOnlyLocalized(title);
  const localizedDescription = thaiOnlyLocalized(description);

  const store = readStore();
  const added = store.addedSubcategories.find((item) => item.id === input.subId);
  if (added) {
    added.title = localizedTitle;
    added.description = localizedDescription;
    added.icon = normalizeEmoji(input.icon) || "📌";
    added.tint = normalizeTint(input.tint);
    writeStore(store);
    return { ok: true, subId: input.subId, categoryId: input.categoryId };
  }

  const builtIn = homeCategoryItems[input.categoryId]?.find((item) => item.id === input.subId);
  if (!builtIn) {
    return { ok: false, errorKey: "operatorMenu.errorSubNotFound" };
  }

  store.subcategoryOverrides[input.subId] = {
    ...store.subcategoryOverrides[input.subId],
    title: localizedTitle,
    description: localizedDescription,
    icon: normalizeEmoji(input.icon) || builtIn.icon,
    tint: normalizeTint(input.tint ?? builtIn.tint),
  };
  writeStore(store);
  return { ok: true, subId: input.subId, categoryId: input.categoryId };
}

export function setSubCategoryHidden(
  subId: string,
  hidden: boolean
): OperatorMenuMutationResult {
  const store = readStore();
  const added = store.addedSubcategories.find((item) => item.id === subId);
  if (added) {
    added.hidden = hidden;
    writeStore(store);
    return { ok: true, subId };
  }

  const builtIn = Object.values(homeCategoryItems)
    .flat()
    .find((item) => item.id === subId);
  if (!builtIn) {
    return { ok: false, errorKey: "operatorMenu.errorSubNotFound" };
  }

  store.subcategoryOverrides[subId] = {
    ...store.subcategoryOverrides[subId],
    hidden,
  };
  writeStore(store);
  return { ok: true, subId };
}

export type CreateOperatorSubCategoryInput = {
  categoryId: string;
  title: string;
  description?: string;
  icon: string;
  tint?: string;
};

export function createOperatorSubCategory(
  input: CreateOperatorSubCategoryInput
): OperatorMenuMutationResult {
  const title = input.title.trim();
  if (!title) {
    return { ok: false, errorKey: "operatorMenu.errorThaiSubTitle" };
  }

  const categoryExists =
    isBuiltInCategoryId(input.categoryId) ||
    isOperatorCategoryId(input.categoryId) ||
    Boolean(getOperatorCategoryById(input.categoryId));
  if (!categoryExists) {
    return { ok: false, errorKey: "operatorMenu.errorCategoryNotFound" };
  }

  const store = readStore();
  const subId = nextSubId(input.categoryId);
  const now = new Date().toISOString();
  const categoryTint =
    getEffectiveHomeCategories(true).find((item) => item.id === input.categoryId)?.tint ??
    DEFAULT_MENU_TINT;

  store.addedSubcategories.push({
    id: subId,
    categoryId: input.categoryId,
    title: thaiOnlyLocalized(title),
    description: thaiOnlyLocalized(input.description?.trim() || DEFAULT_SUB_DESCRIPTION_TH),
    icon: normalizeEmoji(input.icon) || "📌",
    tint: normalizeTint(input.tint ?? categoryTint),
    createdAt: now,
  });
  appendSubCategoryOrder(store, input.categoryId, subId);

  writeStore(store);
  return { ok: true, categoryId: input.categoryId, subId };
}

export function deleteOperatorSubCategory(subId: string): OperatorMenuMutationResult {
  const store = readStore();
  const target = store.addedSubcategories.find((item) => item.id === subId);
  if (!target) {
    return { ok: false, errorKey: "operatorMenu.errorSubNotFound" };
  }
  store.addedSubcategories = store.addedSubcategories.filter((item) => item.id !== subId);
  removeSubCategoryOrder(store, target.categoryId, subId);
  writeStore(store);
  return { ok: true, subId };
}

/** Delete added sub or hide built-in sub from the menu. */
export function deleteSubCategory(subId: string): OperatorMenuMutationResult {
  if (getOperatorSubCategoryById(subId)) {
    return deleteOperatorSubCategory(subId);
  }
  const builtIn = Object.values(homeCategoryItems)
    .flat()
    .find((item) => item.id === subId);
  if (!builtIn) {
    return { ok: false, errorKey: "operatorMenu.errorSubNotFound" };
  }
  return setSubCategoryHidden(subId, true);
}

export function isBuiltInSubCategory(subId: string): boolean {
  return Object.values(homeCategoryItems)
    .flat()
    .some((item) => item.id === subId);
}

export function resetSubCategoryOverride(subId: string): OperatorMenuMutationResult {
  if (getOperatorSubCategoryById(subId)) {
    return { ok: false, errorKey: "operatorMenu.errorAddedSubReset" };
  }
  const store = readStore();
  if (!store.subcategoryOverrides[subId]) {
    return { ok: false, errorKey: "operatorMenu.errorSubNotFound" };
  }
  delete store.subcategoryOverrides[subId];
  writeStore(store);
  return { ok: true, subId };
}

export function resetBuiltInCategoryOverride(categoryId: string): OperatorMenuMutationResult {
  if (!isBuiltInCategoryId(categoryId)) {
    return { ok: false, errorKey: "operatorMenu.errorCategoryNotFound" };
  }
  const store = readStore();
  delete store.categoryOverrides[categoryId];
  writeStore(store);
  return { ok: true, categoryId };
}
