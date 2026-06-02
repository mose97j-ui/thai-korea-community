import type { Post } from "./types";

const UNLOCKED_STORAGE_KEY = "tkc_secret_unlocked";

export const SECRET_PASSWORD_MIN = 4;
export const SECRET_PASSWORD_MAX = 20;

export function validateSecretPassword(password: string): boolean {
  const trimmed = password.trim();
  return (
    trimmed.length >= SECRET_PASSWORD_MIN &&
    trimmed.length <= SECRET_PASSWORD_MAX
  );
}

export async function hashSecretPassword(password: string): Promise<string> {
  const encoded = new TextEncoder().encode(password.trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function isSecretPost(post: Post): boolean {
  return Boolean(post.isSecret && post.secretPasswordHash);
}

export function canViewSecretPost(
  post: Post,
  viewerId?: string | null
): boolean {
  if (!isSecretPost(post)) {
    return true;
  }
  if (viewerId && post.authorId === viewerId) {
    return true;
  }
  return isPostUnlocked(post.id);
}

function readUnlockedIds(): Set<string> {
  if (typeof window === "undefined") {
    return new Set();
  }
  try {
    const raw = sessionStorage.getItem(UNLOCKED_STORAGE_KEY);
    if (!raw) {
      return new Set();
    }
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function writeUnlockedIds(ids: Set<string>): void {
  sessionStorage.setItem(
    UNLOCKED_STORAGE_KEY,
    JSON.stringify([...ids])
  );
}

export function isPostUnlocked(postId: string): boolean {
  return readUnlockedIds().has(postId);
}

export function markPostUnlocked(postId: string): void {
  const ids = readUnlockedIds();
  ids.add(postId);
  writeUnlockedIds(ids);
}

export async function verifySecretPostPassword(
  post: Post,
  password: string
): Promise<boolean> {
  if (!isSecretPost(post) || !post.secretPasswordHash) {
    return true;
  }
  const hash = await hashSecretPassword(password);
  return hash === post.secretPasswordHash;
}

export async function unlockSecretPost(
  post: Post,
  password: string
): Promise<boolean> {
  const ok = await verifySecretPostPassword(post, password);
  if (ok) {
    markPostUnlocked(post.id);
  }
  return ok;
}
