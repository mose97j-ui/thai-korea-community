type PostBoardTarget = {
  id: string;
  categoryId: string;
  subId: string;
};

export function getPostBoardHref(post: PostBoardTarget): string {
  return `/c/${post.categoryId}/${post.subId}#post-${post.id}`;
}

export function getPostDetailHref(postId: string): string {
  return `/p/${postId}`;
}

export function getPostEditHref(postId: string): string {
  return `/p/${postId}/edit`;
}
