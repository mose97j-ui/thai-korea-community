import { getConversationId } from "./conversation";
import { emitSocialChange } from "./events";
import { formatMessagePreview } from "./messagePreview";
import type {
  ConversationPreview,
  DirectMessage,
  MessageSendMode,
} from "./types";

const MESSAGES_KEY = "tkc_messages";
const USERS_KEY = "tkc_users";

function migrateMessage(raw: DirectMessage): DirectMessage {
  return {
    ...raw,
    content: raw.content ?? "",
    images: raw.images ?? [],
    videoUrl: raw.videoUrl?.trim() || undefined,
    sendMode: raw.sendMode ?? "nickname",
    senderDisplayName: raw.senderDisplayName?.trim() || undefined,
  };
}

function readMessages(): DirectMessage[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    return raw ? (JSON.parse(raw) as DirectMessage[]).map(migrateMessage) : [];
  } catch {
    return [];
  }
}

function writeMessages(messages: DirectMessage[]): void {
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
}

export function getMessagesForConversation(
  conversationId: string
): DirectMessage[] {
  return readMessages()
    .filter((message) => message.conversationId === conversationId)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
}

export function getUnreadMessageCount(userId: string): number {
  return readMessages().filter(
    (message) => message.recipientId === userId && !message.readAt
  ).length;
}

export function markConversationRead(
  conversationId: string,
  userId: string
): void {
  const messages = readMessages();
  let changed = false;

  for (const message of messages) {
    if (
      message.conversationId === conversationId &&
      message.recipientId === userId &&
      !message.readAt
    ) {
      message.readAt = new Date().toISOString();
      changed = true;
    }
  }

  if (changed) {
    writeMessages(messages);
    emitSocialChange();
  }
}

export type SendMessageInput = {
  senderId: string;
  recipientId: string;
  content: string;
  sendMode: MessageSendMode;
  senderNickname: string;
  anonymousLabel: string;
  relatedPostId?: string;
  images?: string[];
  videoUrl?: string;
};

export function sendDirectMessage(input: SendMessageInput): DirectMessage {
  const senderDisplayName =
    input.sendMode === "anonymous"
      ? input.anonymousLabel
      : input.senderNickname.trim() || input.anonymousLabel;

  const message: DirectMessage = {
    id: crypto.randomUUID(),
    conversationId: getConversationId(input.senderId, input.recipientId),
    senderId: input.senderId,
    recipientId: input.recipientId,
    content: input.content.trim(),
    sendMode: input.sendMode,
    senderDisplayName,
    images: input.images?.length ? input.images : undefined,
    videoUrl: input.videoUrl?.trim() || undefined,
    relatedPostId: input.relatedPostId,
    createdAt: new Date().toISOString(),
  };

  const messages = readMessages();
  messages.push(message);
  writeMessages(messages);
  emitSocialChange();
  return message;
}

export function getConversationsForUser(
  userId: string,
  previewLabels: { photo: string; video: string; empty: string }
): ConversationPreview[] {
  const users = readUsers();
  const messages = readMessages().filter(
    (message) =>
      message.senderId === userId || message.recipientId === userId
  );

  const map = new Map<string, DirectMessage[]>();
  for (const message of messages) {
    const group = map.get(message.conversationId) ?? [];
    group.push(message);
    map.set(message.conversationId, group);
  }

  const previews: ConversationPreview[] = [];

  for (const [conversationId, group] of map.entries()) {
    const sorted = [...group].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const last = sorted[0];
    const peerId =
      last.senderId === userId ? last.recipientId : last.senderId;
    const peer = users.find((user) => user.id === peerId);

    previews.push({
      conversationId,
      peerId,
      peerNickname: peer?.nickname || peer?.name || "User",
      peerProfileImage: peer?.profileImage,
      lastMessage: formatMessagePreview(last, previewLabels),
      lastMessageAt: last.createdAt,
      unreadCount: group.filter(
        (message) => message.recipientId === userId && !message.readAt
      ).length,
    });
  }

  return previews.sort(
    (a, b) =>
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );
}

function readUsers() {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as import("@/lib/auth/types").User[]) : [];
  } catch {
    return [];
  }
}

export function getMessageSenderLabel(
  message: DirectMessage,
  viewerId: string,
  viewerNickname: string,
  anonymousLabel: string
): string {
  if (message.senderId === viewerId) {
    if (message.sendMode === "anonymous") {
      return anonymousLabel;
    }
    return viewerNickname;
  }

  return message.senderDisplayName || anonymousLabel;
}
