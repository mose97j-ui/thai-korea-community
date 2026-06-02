import {
  getAllHomeCategories,
  getCategorySubItems,
  getHomeCategoryById,
  getSubCategoryItem,
  isPremiumCategoryId,
} from "@/lib/categories/registry";
import type { HomeSubItem } from "@/lib/i18n/content";
import { getPostParsedAddress } from "@/lib/posts/addressParse";
import { getAllPosts } from "@/lib/posts/storage";
import { filterPostsForViewer } from "@/lib/posts/visibility";
import type { Post } from "@/lib/posts/types";

export type SearchCategoryHit = {
  categoryId: string;
  subId?: string;
  labelKo: string;
  labelTh: string;
  descriptionKo?: string;
  descriptionTh?: string;
  icon: string;
  tint: string;
  href: string;
  kind: "category" | "subcategory";
};

export type SearchResults = {
  query: string;
  categories: SearchCategoryHit[];
  posts: Post[];
};

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

function tokenizeQuery(query: string): string[] {
  return normalizeQuery(query)
    .split(/\s+/)
    .filter(Boolean);
}

function matchesTokens(haystack: string, tokens: string[]): boolean {
  if (tokens.length === 0) {
    return false;
  }
  const normalized = haystack.toLowerCase();
  return tokens.every((token) => normalized.includes(token));
}

function buildPostHaystack(post: Post): string {
  const parts = getPostParsedAddress(post);
  const category = getHomeCategoryById(post.categoryId);
  const subItem = getSubCategoryItem(post.categoryId, post.subId);
  const localizedParts = Object.values(post.localized ?? {}).flatMap((entry) => [
    entry.storeName,
    entry.title,
    entry.content,
    entry.address,
  ]);

  return [
    post.storeName,
    post.title,
    post.content,
    post.address,
    post.addressKey,
    post.displayAddress,
    post.roadAddress,
    post.jibunAddress,
    post.authorNickname,
    post.categoryId,
    post.subId,
    parts.label,
    parts.sido,
    parts.sigungu,
    parts.dong,
    category?.label.ko,
    category?.label.th,
    subItem?.title.ko,
    subItem?.title.th,
    subItem?.description.ko,
    subItem?.description.th,
    ...localizedParts,
  ]
    .filter(Boolean)
    .join(" ");
}

function scorePost(post: Post, tokens: string[]): number {
  const parts = getPostParsedAddress(post);
  let score = 0;

  const weightedFields: [string, number][] = [
    [post.storeName, 12],
    [post.title, 10],
    [post.address, 8],
    [parts.label, 7],
    [parts.sido, 5],
    [parts.sigungu, 5],
    [parts.dong, 5],
    [post.authorNickname, 4],
    [post.content, 2],
  ];

  for (const token of tokens) {
    for (const [value, weight] of weightedFields) {
      if (value?.toLowerCase().includes(token)) {
        score += weight;
      }
    }
  }

  return score;
}

function sortPostsByRelevance(posts: Post[], tokens: string[]): Post[] {
  return [...posts].sort((a, b) => {
    const scoreDiff = scorePost(b, tokens) - scorePost(a, tokens);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function buildCategoryHit(
  categoryId: string,
  subItem: HomeSubItem | undefined,
  kind: "category" | "subcategory"
): SearchCategoryHit | null {
  const category = getHomeCategoryById(categoryId);
  if (!category) {
    return null;
  }

  if (kind === "category") {
    return {
      categoryId,
      labelKo: category.label.ko,
      labelTh: category.label.th,
      icon: category.icon,
      tint: category.tint,
      href: category.href,
      kind,
    };
  }

  if (!subItem) {
    return null;
  }

  return {
    categoryId,
    subId: subItem.id,
    labelKo: subItem.title.ko,
    labelTh: subItem.title.th,
    descriptionKo: subItem.description.ko,
    descriptionTh: subItem.description.th,
    icon: subItem.icon,
    tint: subItem.tint,
    href: subItem.href,
    kind,
  };
}

function searchCategories(tokens: string[]): SearchCategoryHit[] {
  const hits: SearchCategoryHit[] = [];
  const seen = new Set<string>();

  const pushHit = (hit: SearchCategoryHit | null) => {
    if (!hit) {
      return;
    }
    const key =
      hit.kind === "category"
        ? `category:${hit.categoryId}`
        : `sub:${hit.categoryId}:${hit.subId}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    hits.push(hit);
  };

  for (const category of getAllHomeCategories()) {
    const categoryHaystack = [
      category.id,
      category.label.ko,
      category.label.th,
    ].join(" ");

    if (matchesTokens(categoryHaystack, tokens)) {
      pushHit(buildCategoryHit(category.id, undefined, "category"));
    }

    for (const subItem of getCategorySubItems(category.id)) {
      const subHaystack = [
        category.id,
        subItem.id,
        category.label.ko,
        category.label.th,
        subItem.title.ko,
        subItem.title.th,
        subItem.description.ko,
        subItem.description.th,
      ].join(" ");

      if (matchesTokens(subHaystack, tokens)) {
        pushHit(buildCategoryHit(category.id, subItem, "subcategory"));
      }
    }
  }

  return hits;
}

export function searchPosts(
  query: string,
  options?: { includePremium?: boolean; viewerId?: string | null }
): Post[] {
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) {
    return [];
  }

  const includePremium = options?.includePremium ?? true;

  const matched = getAllPosts().filter((post) => {
    if (!includePremium && isPremiumCategoryId(post.categoryId)) {
      return false;
    }
    return matchesTokens(buildPostHaystack(post), tokens);
  });

  return sortPostsByRelevance(
    filterPostsForViewer(matched, options?.viewerId),
    tokens
  );
}

export function searchAll(
  query: string,
  options?: { includePremium?: boolean; viewerId?: string | null }
): SearchResults {
  const trimmed = query.trim();
  const tokens = tokenizeQuery(trimmed);

  if (tokens.length === 0) {
    return {
      query: trimmed,
      categories: [],
      posts: [],
    };
  }

  return {
    query: trimmed,
    categories: searchCategories(tokens),
    posts: searchPosts(trimmed, options),
  };
}

export function groupPostsByCategory(posts: Post[]): { categoryId: string; posts: Post[] }[] {
  const map = new Map<string, Post[]>();

  for (const post of posts) {
    const group = map.get(post.categoryId) ?? [];
    group.push(post);
    map.set(post.categoryId, group);
  }

  return getAllHomeCategories()
    .map((category) => ({
      categoryId: category.id,
      posts: map.get(category.id) ?? [],
    }))
    .filter((group) => group.posts.length > 0);
}
