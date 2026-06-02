import { emitSocialChange } from "./events";
import type { PostLike } from "./types";

const LIKES_KEY = "tkc_likes";

function readLikes(): PostLike[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(LIKES_KEY);
    return raw ? (JSON.parse(raw) as PostLike[]) : [];
  } catch {
    return [];
  }
}

function writeLikes(likes: PostLike[]): void {
  localStorage.setItem(LIKES_KEY, JSON.stringify(likes));
}

export function getLikeCount(postId: string): number {
  return readLikes().filter((like) => like.postId === postId).length;
}

export function hasUserLiked(postId: string, userId: string): boolean {
  return readLikes().some(
    (like) => like.postId === postId && like.userId === userId
  );
}

export function toggleLike(
  postId: string,
  userId: string
): { liked: boolean; count: number } {
  const likes = readLikes();
  const index = likes.findIndex(
    (like) => like.postId === postId && like.userId === userId
  );

  if (index >= 0) {
    likes.splice(index, 1);
    writeLikes(likes);
    emitSocialChange();
    return { liked: false, count: getLikeCount(postId) };
  }

  likes.push({
    postId,
    userId,
    createdAt: new Date().toISOString(),
  });
  writeLikes(likes);
  emitSocialChange();
  return { liked: true, count: getLikeCount(postId) };
}

export function getLikesByPostIds(postIds: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const like of readLikes()) {
    if (!postIds.includes(like.postId)) {
      continue;
    }
    map.set(like.postId, (map.get(like.postId) ?? 0) + 1);
  }
  return map;
}

export function deleteLikesByPostId(postId: string): void {
  const likes = readLikes().filter((like) => like.postId !== postId);
  writeLikes(likes);
  emitSocialChange();
}
