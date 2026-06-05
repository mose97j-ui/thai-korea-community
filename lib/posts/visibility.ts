import type { Post } from "@/lib/posts/types";
import { findUserById } from "@/lib/auth/storage";
import { isAdminUser, isOperatorUser } from "@/lib/auth/operator";

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
  return posts.filter((post) => {
    const categoryId =
      "categoryId" in post && typeof post.categoryId === "string"
        ? post.categoryId
        : null;
    // Admin/operator-only idea board.
    if (categoryId === "ideas") {
      const viewer = viewerId ? findUserById(viewerId) : null;
      if (!isOperatorUser(viewer) && !isAdminUser(viewer)) {
        return false;
      }
    }
    return isPostVisibleToViewer(post, viewerId);
  });
}

export function filterPublicPosts<T extends PostVisibility>(posts: T[]): T[] {
  return posts.filter((post) => {
    const categoryId =
      "categoryId" in post && typeof post.categoryId === "string"
        ? post.categoryId
        : null;
    if (categoryId === "ideas") {
      return false;
    }
    return !post.isHiddenByAuthor;
  });
}
