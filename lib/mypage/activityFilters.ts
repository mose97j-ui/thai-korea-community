import { getPostById } from "@/lib/posts/storage";
import type { Post } from "@/lib/posts/types";
import type { PostComment } from "@/lib/social/types";

export type ActivityTypeFilter = "all" | "posts" | "comments";

export type ActivityScopeFilter =
  | { mode: "all" }
  | { mode: "category"; categoryId: string }
  | { mode: "sub"; categoryId: string; subId: string };

export type ActivityRow =
  | { kind: "post"; at: string; post: Post }
  | { kind: "comment"; at: string; comment: PostComment };

export function buildActivityRows(
  posts: Post[],
  comments: PostComment[]
): ActivityRow[] {
  const merged: ActivityRow[] = [
    ...posts.map((post) => ({ kind: "post" as const, at: post.createdAt, post })),
    ...comments.map((comment) => ({
      kind: "comment" as const,
      at: comment.createdAt,
      comment,
    })),
  ];
  merged.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return merged;
}

export function getRowCategoryId(row: ActivityRow): string | undefined {
  if (row.kind === "post") {
    return row.post.categoryId;
  }
  return getPostById(row.comment.postId)?.categoryId;
}

export function getRowSubId(row: ActivityRow): string | undefined {
  if (row.kind === "post") {
    return row.post.subId;
  }
  return getPostById(row.comment.postId)?.subId;
}

export function matchesTypeFilter(
  row: ActivityRow,
  type: ActivityTypeFilter
): boolean {
  if (type === "all") {
    return true;
  }
  if (type === "posts") {
    return row.kind === "post";
  }
  return row.kind === "comment";
}

export function matchesScopeFilter(
  row: ActivityRow,
  scope: ActivityScopeFilter
): boolean {
  if (scope.mode === "all") {
    return true;
  }
  const categoryId = getRowCategoryId(row);
  if (!categoryId || categoryId !== scope.categoryId) {
    return false;
  }
  if (scope.mode === "category") {
    return true;
  }
  return getRowSubId(row) === scope.subId;
}

export function filterActivityRows(
  rows: ActivityRow[],
  type: ActivityTypeFilter,
  scope: ActivityScopeFilter
): ActivityRow[] {
  return rows.filter(
    (row) => matchesTypeFilter(row, type) && matchesScopeFilter(row, scope)
  );
}

export function countActivityRows(
  rows: ActivityRow[],
  type: ActivityTypeFilter,
  scope: ActivityScopeFilter
): number {
  return filterActivityRows(rows, type, scope).length;
}

export function scopeFilterKey(scope: ActivityScopeFilter): string {
  if (scope.mode === "all") {
    return "all";
  }
  if (scope.mode === "category") {
    return `cat:${scope.categoryId}`;
  }
  return `sub:${scope.categoryId}:${scope.subId}`;
}

export type ActivityScopeOption = {
  key: string;
  scope: ActivityScopeFilter;
  categoryId?: string;
  subId?: string;
};

/** Distinct category / sub-board scopes present in the user's activity. */
export function collectActivityScopeOptions(
  rows: ActivityRow[]
): ActivityScopeOption[] {
  const categoryIds = new Set<string>();
  const subKeys = new Set<string>();

  for (const row of rows) {
    const categoryId = getRowCategoryId(row);
    const subId = getRowSubId(row);
    if (!categoryId) {
      continue;
    }
    categoryIds.add(categoryId);
    if (subId) {
      subKeys.add(`${categoryId}\0${subId}`);
    }
  }

  const options: ActivityScopeOption[] = [
    { key: "all", scope: { mode: "all" } },
  ];

  const sortedCategories = [...categoryIds].sort();
  for (const categoryId of sortedCategories) {
    options.push({
      key: `cat:${categoryId}`,
      scope: { mode: "category", categoryId },
      categoryId,
    });
  }

  const sortedSubs = [...subKeys].sort();
  for (const raw of sortedSubs) {
    const [categoryId, subId] = raw.split("\0");
    if (!categoryId || !subId) {
      continue;
    }
    options.push({
      key: `sub:${categoryId}:${subId}`,
      scope: { mode: "sub", categoryId, subId },
      categoryId,
      subId,
    });
  }

  return options;
}
