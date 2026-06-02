import { getCommentCountsByPostIds } from "./comments";
import { getLikesByPostIds } from "./likes";
import {
  HOT_POST_MIN_SCORE,
  type HotPostItem,
} from "./types";

type PostSummary = {
  id: string;
  title: string;
  storeName: string;
  categoryId: string;
  subId: string;
  isSecret?: boolean;
  secretPasswordHash?: string;
  createdAt?: string;
};

function scorePosts(posts: PostSummary[]): HotPostItem[] {
  const postIds = posts.map((post) => post.id);
  const likeMap = getLikesByPostIds(postIds);
  const commentMap = getCommentCountsByPostIds(postIds);

  return posts.map((post) => {
    const likeCount = likeMap.get(post.id) ?? 0;
    const commentCount = commentMap.get(post.id) ?? 0;
    const hotScore = likeCount + commentCount;

    return {
      postId: post.id,
      title: post.storeName?.trim() || post.title?.trim() || "—",
      likeCount,
      commentCount,
      hotScore,
      categoryId: post.categoryId,
      subId: post.subId,
      isSecret: Boolean(post.isSecret && post.secretPasswordHash),
    };
  });
}

function sortByPopularity(posts: PostSummary[], items: HotPostItem[]): HotPostItem[] {
  const order = new Map(posts.map((post, index) => [post.id, index]));

  return [...items].sort((a, b) => {
    if (b.hotScore !== a.hotScore) {
      return b.hotScore - a.hotScore;
    }
    if (b.likeCount !== a.likeCount) {
      return b.likeCount - a.likeCount;
    }
    return (order.get(a.postId) ?? 0) - (order.get(b.postId) ?? 0);
  });
}

/** Recent / engaged posts for sidebar — no minimum score. */
export function getPopularPosts(
  posts: PostSummary[],
  limit = 6
): HotPostItem[] {
  return sortByPopularity(posts, scorePosts(posts)).slice(0, limit);
}

/** Hot board — likes + comments must meet threshold (Everytime-style). */
export function getHotPosts(
  posts: PostSummary[],
  limit = 6
): HotPostItem[] {
  return sortByPopularity(posts, scorePosts(posts))
    .filter((item) => item.hotScore >= HOT_POST_MIN_SCORE)
    .slice(0, limit);
}

export function isHotPost(postId: string, posts: PostSummary[]): boolean {
  return getHotPosts(posts, 100).some((item) => item.postId === postId);
}
