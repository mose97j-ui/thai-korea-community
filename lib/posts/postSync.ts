import type { User } from "@/lib/auth/types";
import type { Post } from "@/lib/posts/types";
import { emitSocialChange } from "@/lib/social/events";

export const POSTS_SYNC_EVENT = "tkc-posts-sync";
const POSTS_CHANGE_EVENT = "tkc-posts-change";

const POSTS_KEY = "tkc_posts";
const POSTS_DELETE_TOMBSTONES_KEY = "tkc_posts_delete_tombstones";
const DELETE_TOMBSTONE_TTL_MS = 24 * 60 * 60 * 1000;

function readLocalPosts(): Post[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(POSTS_KEY);
    return raw ? (JSON.parse(raw) as Post[]) : [];
  } catch {
    return [];
  }
}

function writeLocalPosts(posts: Post[]): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
}

function dispatchPostsEvents() {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(POSTS_SYNC_EVENT));
  window.dispatchEvent(new Event(POSTS_CHANGE_EVENT));
  emitSocialChange();
}

function readDeleteTombstones(): Record<string, number> {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = localStorage.getItem(POSTS_DELETE_TOMBSTONES_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    const now = Date.now();
    const next: Record<string, number> = {};
    for (const [id, expiresAt] of Object.entries(parsed)) {
      if (typeof expiresAt === "number" && expiresAt > now) {
        next[id] = expiresAt;
      }
    }
    return next;
  } catch {
    return {};
  }
}

function writeDeleteTombstones(tombstones: Record<string, number>) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(POSTS_DELETE_TOMBSTONES_KEY, JSON.stringify(tombstones));
}

function rememberDeletedPostIds(ids: string[]) {
  if (typeof window === "undefined" || ids.length === 0) {
    return;
  }
  const tombstones = readDeleteTombstones();
  const expiresAt = Date.now() + DELETE_TOMBSTONE_TTL_MS;
  for (const id of ids) {
    if (id) {
      tombstones[id] = expiresAt;
    }
  }
  writeDeleteTombstones(tombstones);
}

function clearDeletedPostIds(ids: string[]) {
  if (typeof window === "undefined" || ids.length === 0) {
    return;
  }
  const tombstones = readDeleteTombstones();
  let changed = false;
  for (const id of ids) {
    if (id in tombstones) {
      delete tombstones[id];
      changed = true;
    }
  }
  if (changed) {
    writeDeleteTombstones(tombstones);
  }
}

function isDeletedTombstone(id: string): boolean {
  const tombstones = readDeleteTombstones();
  return typeof tombstones[id] === "number";
}

function pickNewerPost(local: Post, remote: Post): Post {
  const localUpdated = new Date(local.updatedAt ?? local.createdAt).getTime();
  const remoteUpdated = new Date(remote.updatedAt ?? remote.createdAt).getTime();
  if (remoteUpdated !== localUpdated) {
    return remoteUpdated > localUpdated ? remote : local;
  }
  return remote.createdAt >= local.createdAt ? remote : local;
}

function sortPosts(posts: Post[]): Post[] {
  return [...posts].sort(
    (a, b) =>
      new Date(b.updatedAt ?? b.createdAt).getTime() -
      new Date(a.updatedAt ?? a.createdAt).getTime()
  );
}

function isSamePost(a: Post, b: Post): boolean {
  return (
    a.id === b.id &&
    a.updatedAt === b.updatedAt &&
    a.title === b.title &&
    a.content === b.content &&
    a.categoryId === b.categoryId &&
    a.subId === b.subId
  );
}

export function mergeRemotePosts(remote: Post[]): boolean {
  if (typeof window === "undefined" || remote.length === 0) {
    return false;
  }

  const filteredRemote = remote.filter((post) => !isDeletedTombstone(post.id));
  if (filteredRemote.length === 0) {
    return false;
  }

  const merged = new Map(readLocalPosts().map((post) => [post.id, post]));
  let changed = false;

  for (const post of filteredRemote) {
    const existing = merged.get(post.id);
    const next = existing ? pickNewerPost(existing, post) : post;
    if (!existing || !isSamePost(existing, next)) {
      merged.set(post.id, next);
      changed = true;
    }
  }

  if (!changed) {
    return false;
  }

  writeLocalPosts(sortPosts([...merged.values()]));
  dispatchPostsEvents();
  return true;
}

export async function syncPostToServer(post: Post): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    clearDeletedPostIds([post.id]);
    const response = await fetch("/api/posts/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post }),
      cache: "no-store",
    });
    if (response.ok) {
      dispatchPostsEvents();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function schedulePostSync(post: Post): void {
  if (typeof window === "undefined") {
    return;
  }
  void syncPostToServer(post);
}

export async function fetchPostsFromApi(): Promise<number> {
  if (typeof window === "undefined") {
    return 0;
  }

  try {
    const response = await fetch("/api/posts", {
      cache: "no-store",
      headers: { Pragma: "no-cache" },
    });
    if (!response.ok) {
      return 0;
    }
    const payload = (await response.json()) as { posts?: Post[] };
    const posts = payload.posts ?? [];
    if (posts.length === 0) {
      return 0;
    }
    mergeRemotePosts(posts);
    return posts.length;
  } catch {
    return 0;
  }
}

export async function fetchPostsFromSupabaseClient(): Promise<number> {
  if (typeof window === "undefined") {
    return 0;
  }
  try {
    const { fetchAllPostsClient } = await import("@/lib/supabase/postsClient");
    const posts = await fetchAllPostsClient();
    if (posts.length === 0) {
      return 0;
    }
    mergeRemotePosts(posts);
    return posts.length;
  } catch {
    return 0;
  }
}

export async function pushAllLocalPostsToServer(): Promise<number> {
  let synced = 0;
  for (const post of readLocalPosts()) {
    if (await syncPostToServer(post)) {
      synced += 1;
    }
  }
  return synced;
}

export async function pullPostsForUser(_user: User): Promise<number> {
  const fromApi = await fetchPostsFromApi();
  const fromClient = await fetchPostsFromSupabaseClient();
  await pushAllLocalPostsToServer();
  return Math.max(fromApi, fromClient);
}

export async function syncPostDeletionsToServer(ids: string[]): Promise<void> {
  if (typeof window === "undefined" || ids.length === 0) {
    return;
  }

  rememberDeletedPostIds(ids);
  try {
    const response = await fetch("/api/posts/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
      cache: "no-store",
    });
    if (response.ok) {
      dispatchPostsEvents();
    }
  } catch {
    // Local delete still applies.
  }
}

export function schedulePostDeletionsSync(ids: string[]): void {
  if (typeof window === "undefined" || ids.length === 0) {
    return;
  }
  void syncPostDeletionsToServer(ids);
}
