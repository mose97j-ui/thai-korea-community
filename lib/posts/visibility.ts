import type { Post } from "@/lib/posts/types";

type PostVisibility = Pick<Post, "authorId" | "isHiddenByAuthor">;

export function isPostVisibleToViewer(
  post: PostVisibility,
  viewerId?: string | null
): boolean {
  if (!post.isHiddenByAuthor) {
    return true;
  }

  return Boolean(viewerId && post.authorId === viewerId);
}

export function filterPostsForViewer<T extends PostVisibility>(
  posts: T[],
  viewerId?: string | null
): T[] {
  return posts.filter((post) => isPostVisibleToViewer(post, viewerId));
}

export function filterPublicPosts<T extends PostVisibility>(posts: T[]): T[] {
  return posts.filter((post) => !post.isHiddenByAuthor);
}
