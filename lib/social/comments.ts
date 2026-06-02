import { emitSocialChange } from "./events";
import type { PostComment } from "./types";

const COMMENTS_KEY = "tkc_comments";

function readComments(): PostComment[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(COMMENTS_KEY);
    return raw ? (JSON.parse(raw) as PostComment[]) : [];
  } catch {
    return [];
  }
}

function writeComments(comments: PostComment[]): void {
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
}

export function getCommentsByPost(postId: string): PostComment[] {
  return readComments()
    .filter((comment) => comment.postId === postId)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
}

export function getCommentsByAuthorId(authorId: string): PostComment[] {
  return readComments()
    .filter((comment) => comment.authorId === authorId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export function getCommentCount(postId: string): number {
  return readComments().filter((comment) => comment.postId === postId).length;
}

export function getCommentCountsByPostIds(
  postIds: string[]
): Map<string, number> {
  const map = new Map<string, number>();
  for (const comment of readComments()) {
    if (!postIds.includes(comment.postId)) {
      continue;
    }
    map.set(comment.postId, (map.get(comment.postId) ?? 0) + 1);
  }
  return map;
}

type AddCommentInput = {
  postId: string;
  authorId: string;
  authorNickname: string;
  authorProfileImage?: string;
  content: string;
};

export function addComment(input: AddCommentInput): PostComment {
  const comment: PostComment = {
    id: crypto.randomUUID(),
    postId: input.postId,
    authorId: input.authorId,
    authorNickname: input.authorNickname.trim(),
    authorProfileImage: input.authorProfileImage,
    content: input.content.trim(),
    createdAt: new Date().toISOString(),
  };

  const comments = readComments();
  comments.push(comment);
  writeComments(comments);
  emitSocialChange();
  return comment;
}

export function deleteComment(commentId: string, userId: string): boolean {
  const comments = readComments();
  const index = comments.findIndex((comment) => comment.id === commentId);
  if (index === -1) {
    return false;
  }
  if (comments[index].authorId !== userId) {
    return false;
  }
  comments.splice(index, 1);
  writeComments(comments);
  emitSocialChange();
  return true;
}

export function deleteCommentsByPostId(postId: string): void {
  const comments = readComments().filter((comment) => comment.postId !== postId);
  writeComments(comments);
  emitSocialChange();
}
