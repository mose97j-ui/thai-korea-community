import { findUserById } from "@/lib/auth/storage";
import {
  getConversationId,
  getConversationIdBetweenUsers,
  getPeerId,
  messageInvolvesUser,
  messageIsUnreadForUser,
  remapPeerIdForViewer,
  resolveUserGmail,
} from "./conversation";
import type { User } from "@/lib/auth/types";
import { emitSocialChange } from "./events";
import { isConversationHiddenForUser } from "./conversationHide";
import { conversationIdsMatch } from "./messageFilters";
import { scheduleDirectMessageSync } from "./messageSync";
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

function normalizeConversationIds(messages: DirectMessage[]): DirectMessage[] {
  return messages.map((message) => {
    const sender = findUserById(message.senderId);
    const recipient = findUserById(message.recipientId);
    if (!sender || !recipient) {
      return message;
    }
    return {
      ...message,
      conversationId: getConversationIdBetweenUsers(sender, recipient),
    };
  });
}

function readMessages(): DirectMessage[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    return raw
      ? normalizeConversationIds(
          (JSON.parse(raw) as DirectMessage[]).map(migrateMessage)
        )
      : [];
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
  const keys = new Set(
    conversationId.includes("\u0001")
      ? conversationId.split("\u0001")
      : [conversationId]
  );

  return readMessages()
    .filter((message) => {
      if (message.conversationId === conversationId) {
        return true;
      }
      if (!message.conversationId.includes("\u0001")) {
        return false;
      }
      const parts = message.conversationId.split("\u0001");
      return parts.length === 2 && keys.has(parts[0]) && keys.has(parts[1]);
    })
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
}

export function getUnreadMessageCount(userId: string, gmail?: string): number {
  const viewer: User = findUserById(userId) ?? {
    id: userId,
    name: "",
    nickname: "",
    birthDate: "",
    hometown: "",
    gmail: gmail ?? "",
    koreanPhone: "",
    personalCode: "",
    password: "",
    createdAt: new Date().toISOString(),
  };
  if (gmail && !viewer.gmail) {
    viewer.gmail = gmail;
  }
  return readMessages().filter((message) => messageIsUnreadForUser(message, viewer))
    .length;
}

export function markConversationRead(conversationId: string, viewer: User): void {
  const messages = readMessages();
  let changed = false;

  for (const message of messages) {
    if (
      conversationIdsMatch(message.conversationId, conversationId) &&
      messageIsUnreadForUser(message, viewer)
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

  const sender = findUserById(input.senderId);
  const recipient = findUserById(input.recipientId);
  const conversationId =
    sender && recipient
      ? getConversationIdBetweenUsers(sender, recipient)
      : getConversationId(
          input.senderId,
          input.recipientId,
          resolveUserGmail(input.senderId),
          resolveUserGmail(input.recipientId)
        );

  const message: DirectMessage = {
    id: crypto.randomUUID(),
    conversationId,
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
  scheduleDirectMessageSync(message);
  return message;
}

export function getConversationsForUser(
  viewer: User,
  previewLabels: { photo: string; video: string; empty: string }
): ConversationPreview[] {
  const users = readUsers();
  const messages = readMessages().filter((message) =>
    messageInvolvesUser(message, viewer)
  );

  const map = new Map<string, DirectMessage[]>();
  for (const message of messages) {
    const group = map.get(message.conversationId) ?? [];
    group.push(message);
    map.set(message.conversationId, group);
  }

  const previews: ConversationPreview[] = [];

  for (const [conversationId, group] of map.entries()) {
    if (isConversationHiddenForUser(viewer.id, conversationId)) {
      continue;
    }
    const sorted = [...group].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const last = sorted[0];
    const rawPeerId = getPeerId(conversationId, viewer.id);
    const peerId = remapPeerIdForViewer(rawPeerId, viewer);
    const peer = users.find((user) => user.id === peerId);

    previews.push({
      conversationId,
      peerId,
      peerNickname: peer?.nickname || peer?.name || last.senderDisplayName || "User",
      peerProfileImage: peer?.profileImage,
      lastMessage: formatMessagePreview(last, previewLabels),
      lastMessageAt: last.createdAt,
      unreadCount: group.filter((message) => messageIsUnreadForUser(message, viewer))
        .length,
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
