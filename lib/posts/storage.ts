import type { Locale } from "@/lib/i18n/types";
import { translatePostFields } from "@/lib/translate/service";
import { deleteCommentsByPostId } from "@/lib/social/comments";
import { deleteLikesByPostId } from "@/lib/social/likes";
import { buildDisplayAddress } from "@/lib/maps/formatAddress";
import { normalizeAddressKey } from "./address";
import { detectPostSourceLocale } from "./detectLocale";
import { normalizeVideoUrl } from "./media";
import type {
  AddressGroup,
  CreatePostInput,
  Post,
  PostLocalizedText,
  SubCategoryPostGroup,
  UpdatePostInput,
} from "./types";

const POSTS_KEY = "tkc_posts";
export const POSTS_CHANGE_EVENT = "tkc-posts-change";
const NO_ADDRESS_KEY = "__no_address__";

function notifyPostsChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(POSTS_CHANGE_EVENT));
  }
}

export function getPostSourceFields(post: Post): PostLocalizedText {
  return {
    storeName: post.storeName?.trim() || post.title?.trim() || "",
    title: post.title?.trim() || post.storeName?.trim() || "",
    content: post.content?.trim() || "",
    address: post.address?.trim() || "",
  };
}

function migratePost(raw: Post): Post {
  const sourceFields = getPostSourceFields(raw);
  const sourceLocale = raw.sourceLocale ?? detectPostSourceLocale(raw);
  const localized: Partial<Record<Locale, PostLocalizedText>> = {
    ...raw.localized,
    [sourceLocale]: raw.localized?.[sourceLocale] ?? sourceFields,
  };

  return {
    ...raw,
    storeName: sourceFields.storeName,
    title: sourceFields.title,
    content: sourceFields.content,
    address: sourceFields.address,
    addressKey:
      raw.addressKey?.trim() || normalizeAddressKey(sourceFields.address) || "",
    displayAddress:
      raw.displayAddress?.trim() ||
      buildDisplayAddress({
        roadAddress: raw.roadAddress,
        jibunAddress: raw.jibunAddress,
        fallback: sourceFields.address,
      }) ||
      undefined,
    roadAddress: raw.roadAddress?.trim() || undefined,
    jibunAddress: raw.jibunAddress?.trim() || undefined,
    mapLat: typeof raw.mapLat === "number" ? raw.mapLat : undefined,
    mapLng: typeof raw.mapLng === "number" ? raw.mapLng : undefined,
    sourceLocale,
    localized,
    images: raw.images ?? [],
    videoUrl: raw.videoUrl?.trim() || undefined,
    isSecret: raw.isSecret ?? false,
    secretPasswordHash: raw.secretPasswordHash?.trim() || undefined,
    isHiddenByAuthor: raw.isHiddenByAuthor ?? false,
    placeReview: raw.placeReview,
  };
}

function readPosts(): Post[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(POSTS_KEY);
    return raw ? (JSON.parse(raw) as Post[]).map(migratePost) : [];
  } catch {
    return [];
  }
}

function writePosts(posts: Post[]): void {
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
  notifyPostsChange();
}

function sortPosts(posts: Post[]): Post[] {
  return [...posts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function getPostAddressKey(post: Post): string {
  return post.addressKey || normalizeAddressKey(post.address) || NO_ADDRESS_KEY;
}

export { getPostAddressKey };

function getPostAddressLabel(post: Post, noAddressLabel: string): string {
  if (getPostAddressKey(post) === NO_ADDRESS_KEY) {
    return noAddressLabel;
  }
  return post.address || post.addressKey;
}

export function getPostsBySubCategory(
  categoryId: string,
  subId: string
): Post[] {
  return sortPosts(
    readPosts().filter(
      (post) => post.categoryId === categoryId && post.subId === subId
    )
  );
}

export function getSubCategoryPostCount(
  categoryId: string,
  subId: string
): number {
  return getPostsBySubCategory(categoryId, subId).length;
}

export function getPostsByCategory(categoryId: string): Post[] {
  return sortPosts(
    readPosts().filter((post) => post.categoryId === categoryId)
  );
}

export function getPostById(postId: string): Post | null {
  return readPosts().find((post) => post.id === postId) ?? null;
}

export function getAllPosts(): Post[] {
  return sortPosts(readPosts());
}

export function getPostsByAuthorId(authorId: string): Post[] {
  return sortPosts(readPosts().filter((post) => post.authorId === authorId));
}

export function getAddressGroups(
  categoryId: string,
  noAddressLabel = "—",
  subId?: string
): AddressGroup[] {
  const posts = subId
    ? getPostsBySubCategory(categoryId, subId)
    : getPostsByCategory(categoryId);
  const map = new Map<string, AddressGroup>();

  for (const post of posts) {
    const key = getPostAddressKey(post);
    const existing = map.get(key);
    if (existing) {
      existing.postCount += 1;
      continue;
    }

    map.set(key, {
      addressKey: key,
      address: getPostAddressLabel(post, noAddressLabel),
      postCount: 1,
    });
  }

  return [...map.values()].sort((a, b) => {
    if (a.addressKey === NO_ADDRESS_KEY) {
      return 1;
    }
    if (b.addressKey === NO_ADDRESS_KEY) {
      return -1;
    }
    return a.address.localeCompare(b.address, "ko");
  });
}

export function getPostsGroupedBySubCategory(
  categoryId: string,
  addressKey: string,
  subId?: string
): SubCategoryPostGroup[] {
  const posts = getPostsByCategory(categoryId).filter((post) => {
    if (getPostAddressKey(post) !== addressKey) {
      return false;
    }
    if (subId && post.subId !== subId) {
      return false;
    }
    return true;
  });

  const map = new Map<string, Post[]>();
  for (const post of posts) {
    const group = map.get(post.subId) ?? [];
    group.push(post);
    map.set(post.subId, group);
  }

  return [...map.entries()]
    .map(([subId, groupPosts]) => ({
      subId,
      posts: sortPosts(groupPosts),
    }))
    .sort((a, b) => a.subId.localeCompare(b.subId));
}

export function updatePostLocalization(
  postId: string,
  locale: Locale,
  localized: PostLocalizedText
): Post | null {
  const posts = readPosts();
  const index = posts.findIndex((post) => post.id === postId);
  if (index === -1) {
    return null;
  }

  const current = posts[index];
  posts[index] = {
    ...current,
    localized: {
      ...current.localized,
      [locale]: localized,
    },
  };
  writePosts(posts);
  return posts[index];
}

export function createPost(input: CreatePostInput): Post {
  const address = normalizeAddressKey(input.address);
  const displayAddress =
    input.displayAddress?.trim() ||
    buildDisplayAddress({
      roadAddress: input.roadAddress,
      jibunAddress: input.jibunAddress,
      fallback: address,
    });
  const sourceFields: PostLocalizedText = {
    storeName: input.storeName.trim(),
    title: input.title.trim() || input.storeName.trim(),
    content: input.content.trim(),
    address: displayAddress || address,
  };

  const post: Post = {
    id: crypto.randomUUID(),
    categoryId: input.categoryId,
    subId: input.subId,
    storeName: sourceFields.storeName,
    address: displayAddress || address,
    addressKey: address,
    roadAddress: input.roadAddress?.trim() || undefined,
    jibunAddress: input.jibunAddress?.trim() || undefined,
    displayAddress: displayAddress || undefined,
    mapLat: input.mapLat,
    mapLng: input.mapLng,
    authorId: input.authorId,
    authorNickname: input.authorNickname,
    authorProfileImage: input.authorProfileImage,
    title: sourceFields.title,
    content: sourceFields.content,
    sourceLocale: input.sourceLocale,
    localized: {
      [input.sourceLocale]: sourceFields,
    },
    images: input.images ?? [],
    videoUrl: input.videoUrl ? normalizeVideoUrl(input.videoUrl) : undefined,
    isSecret: input.isSecret ?? false,
    secretPasswordHash: input.secretPasswordHash,
    placeReview: input.placeReview,
    createdAt: new Date().toISOString(),
  };

  const posts = readPosts();
  posts.push(post);
  writePosts(posts);
  return post;
}

export async function createPostWithTranslation(
  input: CreatePostInput
): Promise<Post> {
  const post = createPost(input);
  const targetLocale: Locale = input.sourceLocale === "ko" ? "th" : "ko";
  const sourceFields = getPostSourceFields(post);

  try {
    const translated = await translatePostFields(
      sourceFields,
      input.sourceLocale,
      targetLocale
    );
    return updatePostLocalization(post.id, targetLocale, translated) ?? post;
  } catch {
    return post;
  }
}

export function updatePost(postId: string, input: UpdatePostInput): Post | null {
  const posts = readPosts();
  const index = posts.findIndex((post) => post.id === postId);
  if (index === -1) {
    return null;
  }

  const current = posts[index];
  const address = normalizeAddressKey(input.address);
  const displayAddress =
    input.displayAddress?.trim() ||
    buildDisplayAddress({
      roadAddress: input.roadAddress,
      jibunAddress: input.jibunAddress,
      fallback: address,
    });
  const sourceFields: PostLocalizedText = {
    storeName: input.storeName.trim(),
    title: input.title.trim() || input.storeName.trim(),
    content: input.content.trim(),
    address: displayAddress || address,
  };

  const isSecret = input.isSecret ?? false;
  const updated: Post = {
    ...current,
    storeName: sourceFields.storeName,
    title: sourceFields.title,
    content: sourceFields.content,
    address: displayAddress || address,
    addressKey: address,
    roadAddress: input.roadAddress?.trim() || current.roadAddress,
    jibunAddress: input.jibunAddress?.trim() || current.jibunAddress,
    displayAddress: displayAddress || current.displayAddress,
    mapLat: input.mapLat ?? current.mapLat,
    mapLng: input.mapLng ?? current.mapLng,
    images: input.images ?? [],
    videoUrl: input.videoUrl ? normalizeVideoUrl(input.videoUrl) : undefined,
    sourceLocale: input.sourceLocale,
    localized: {
      [input.sourceLocale]: sourceFields,
    },
    isSecret,
    secretPasswordHash: isSecret
      ? input.secretPasswordHash ?? current.secretPasswordHash
      : undefined,
    placeReview: input.placeReview ?? current.placeReview,
  };

  posts[index] = updated;
  writePosts(posts);
  return updated;
}

export async function updatePostWithTranslation(
  postId: string,
  input: UpdatePostInput
): Promise<Post | null> {
  const post = updatePost(postId, input);
  if (!post) {
    return null;
  }

  const targetLocale: Locale = input.sourceLocale === "ko" ? "th" : "ko";
  const sourceFields = getPostSourceFields(post);

  try {
    const translated = await translatePostFields(
      sourceFields,
      input.sourceLocale,
      targetLocale
    );
    return updatePostLocalization(post.id, targetLocale, translated) ?? post;
  } catch {
    return post;
  }
}

export function deletePost(postId: string): boolean {
  const posts = readPosts();
  const index = posts.findIndex((post) => post.id === postId);
  if (index === -1) {
    return false;
  }

  posts.splice(index, 1);
  writePosts(posts);
  deleteCommentsByPostId(postId);
  deleteLikesByPostId(postId);
  return true;
}

export function deletePostsByCategory(categoryId: string): number {
  const posts = readPosts();
  const toDelete = posts.filter((post) => post.categoryId === categoryId);
  if (toDelete.length === 0) {
    return 0;
  }

  writePosts(posts.filter((post) => post.categoryId !== categoryId));

  for (const post of toDelete) {
    deleteCommentsByPostId(post.id);
    deleteLikesByPostId(post.id);
  }

  return toDelete.length;
}

export function setPostHiddenByAuthor(
  postId: string,
  userId: string,
  hidden: boolean
): Post | null {
  const posts = readPosts();
  const index = posts.findIndex((post) => post.id === postId);
  if (index === -1 || posts[index].authorId !== userId) {
    return null;
  }

  const updated: Post = {
    ...posts[index],
    isHiddenByAuthor: hidden,
  };

  posts[index] = updated;
  writePosts(posts);
  return updated;
}
