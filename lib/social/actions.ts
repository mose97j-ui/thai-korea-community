import { findOperatorAccount, isOperatorUser } from "@/lib/auth/operator";
import { resolveNotificationUserId } from "@/lib/social/notificationRecipient";
import { findUserById } from "@/lib/auth/storage";
import { isMessagingBlocked } from "@/lib/social/blocks";
import { hasOperatorPrivileges } from "@/lib/auth/operatorView";
import { getConversationId } from "@/lib/social/conversation";
import type { PostComment } from "@/lib/social/types";
import { addComment } from "@/lib/social/comments";
import { createNotification } from "@/lib/social/notifications";
import { hasUserLiked, toggleLike } from "@/lib/social/likes";
import {
  sendDirectMessage,
  type SendMessageInput,
} from "@/lib/social/messages";
import type { Post } from "@/lib/posts/types";
import type { User } from "@/lib/auth/types";

export type HandleSendMessageInput = {
  sender: User;
  recipientId: string;
  content: string;
  sendMode: SendMessageInput["sendMode"];
  anonymousLabel: string;
  relatedPostId?: string;
  images?: string[];
  videoUrl?: string;
};

export function handleToggleLike(
  post: Post,
  user: User
): { liked: boolean; count: number } {
  const wasLiked = hasUserLiked(post.id, user.id);
  const result = toggleLike(post.id, user.id);

  if (result.liked && !wasLiked && post.authorId !== user.id) {
    createNotification({
      userId: post.authorId,
      type: "like",
      actorId: user.id,
      actorNickname: user.nickname || user.name,
      postId: post.id,
      preview: post.storeName || post.title,
    });
  }

  return result;
}

export function handleAddComment(
  post: Post,
  user: User,
  content: string
): PostComment {
  const comment = addComment({
    postId: post.id,
    authorId: user.id,
    authorNickname: user.nickname || user.name,
    authorProfileImage: user.profileImage,
    content,
  });

  if (post.authorId !== user.id) {
    createNotification({
      userId: post.authorId,
      type: "comment",
      actorId: user.id,
      actorNickname: user.nickname || user.name,
      postId: post.id,
      commentId: comment.id,
      preview: content.slice(0, 80),
    });
  }

  return comment;
}

export function canSendMessageToUser(
  senderId: string,
  recipientId: string,
  sender?: User | null
): { ok: true } | { ok: false; reason: "blocked" | "self" } {
  if (senderId === recipientId) {
    return { ok: false, reason: "self" };
  }
  if (sender && hasOperatorPrivileges(sender)) {
    return { ok: true };
  }
  if (isMessagingBlocked(senderId, recipientId)) {
    return { ok: false, reason: "blocked" };
  }
  return { ok: true };
}

export function handleSendMessage(input: HandleSendMessageInput) {
  const permission = canSendMessageToUser(
    input.sender.id,
    input.recipientId,
    input.sender
  );
  if (!permission.ok) {
    return { ok: false as const, reason: permission.reason };
  }

  const message = sendDirectMessage({
    senderId: input.sender.id,
    recipientId: input.recipientId,
    content: input.content,
    sendMode: input.sendMode,
    senderNickname: input.sender.nickname || input.sender.name,
    anonymousLabel: input.anonymousLabel,
    relatedPostId: input.relatedPostId,
    images: input.images,
    videoUrl: input.videoUrl,
  });

  if (input.recipientId !== input.sender.id) {
    const actorNickname =
      input.sendMode === "anonymous"
        ? input.anonymousLabel
        : input.sender.nickname || input.sender.name;

    const recipient = findUserById(input.recipientId);
    const notifyTarget =
      recipient && isOperatorUser(recipient)
        ? findOperatorAccount() ?? recipient
        : recipient;
    const notifyUserId = notifyTarget
      ? resolveNotificationUserId(notifyTarget)
      : input.recipientId;

    createNotification({
      userId: notifyUserId,
      type: "message",
      actorId: input.sender.id,
      actorNickname,
      messageId: message.id,
      postId: input.relatedPostId,
      preview: message.content.slice(0, 80) || input.anonymousLabel,
    });
  }

  return { ok: true as const, message };
}

export function getMessageThreadHref(
  currentUserId: string,
  peerId: string,
  relatedPostId?: string
): string {
  const params = relatedPostId
    ? `?post=${encodeURIComponent(relatedPostId)}`
    : "";
  return `/messages/${peerId}${params}`;
}

export { getConversationId };
