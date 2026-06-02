import {
  getAllHomeCategories,
  getCategorySubItems,
  getHomeCategoryById,
} from "@/lib/categories/registry";
import type { HomeSubItem } from "@/lib/i18n/content";
import { isPlaceBasedCategory } from "@/lib/posts/formTemplates";
import { getPostParsedAddress } from "@/lib/posts/addressParse";
import { getAllPosts } from "@/lib/posts/storage";
import type { Post } from "@/lib/posts/types";
import type { SearchCategoryHit } from "@/lib/posts/search";
import type { GeocodeResult } from "./types";

function buildCategoryHit(
  categoryId: string,
  subItem: HomeSubItem | undefined,
  kind: "category" | "subcategory",
  addressQuery: string
): SearchCategoryHit | null {
  const category = getHomeCategoryById(categoryId);
  if (!category) {
    return null;
  }

  const addressParam = encodeURIComponent(addressQuery);

  if (kind === "category") {
    return {
      categoryId,
      labelKo: category.label.ko,
      labelTh: category.label.th,
      icon: category.icon,
      tint: category.tint,
      href: `${category.href}?address=${addressParam}`,
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
    href: `${subItem.href}?address=${addressParam}`,
    kind: "subcategory",
  };
}

export function classifyAddressToCategories(
  geocode: GeocodeResult
): SearchCategoryHit[] {
  const addressQuery = geocode.displayAddress || geocode.query;
  const hits: SearchCategoryHit[] = [];
  const seen = new Set<string>();

  for (const category of getAllHomeCategories()) {
    if (!isPlaceBasedCategory(category.id)) {
      continue;
    }

    const categoryHit = buildCategoryHit(
      category.id,
      undefined,
      "category",
      addressQuery
    );
    if (categoryHit) {
      const key = `category:${category.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        hits.push(categoryHit);
      }
    }

    for (const subItem of getCategorySubItems(category.id)) {
      const subHit = buildCategoryHit(
        category.id,
        subItem,
        "subcategory",
        addressQuery
      );
      if (!subHit) {
        continue;
      }
      const key = `sub:${category.id}:${subItem.id}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      hits.push(subHit);
    }
  }

  return hits;
}

function matchesGeocodedAddress(post: Post, geocode: GeocodeResult): boolean {
  const query = geocode.query.toLowerCase();
  const display = geocode.displayAddress.toLowerCase();
  const parts = getPostParsedAddress(post);
  const geocodeParts = geocode.parsed;

  const haystack = [
    post.address,
    post.addressKey,
    post.displayAddress,
    post.roadAddress,
    post.jibunAddress,
    post.storeName,
    parts.label,
    parts.sido,
    parts.sigungu,
    parts.dong,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (query && haystack.includes(query)) {
    return true;
  }
  if (display && haystack.includes(display)) {
    return true;
  }

  if (
    geocodeParts.sido &&
    parts.sido === geocodeParts.sido &&
    geocodeParts.sigungu &&
    parts.sigungu === geocodeParts.sigungu
  ) {
    if (!geocodeParts.dong || geocodeParts.dong.startsWith("__")) {
      return true;
    }
    return parts.dong === geocodeParts.dong;
  }

  return false;
}

export function filterPostsByGeocode(
  posts: Post[],
  geocode: GeocodeResult
): Post[] {
  return posts.filter((post) => matchesGeocodedAddress(post, geocode));
}

export function groupPostsByCategoryForAddress(
  posts: Post[],
  geocode: GeocodeResult
): { categoryId: string; posts: Post[] }[] {
  const matched = filterPostsByGeocode(posts, geocode);
  const map = new Map<string, Post[]>();

  for (const post of matched) {
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

export function getAddressMatchedPosts(geocode: GeocodeResult): Post[] {
  return filterPostsByGeocode(getAllPosts(), geocode);
}
