import { hasOperatorPrivileges } from "@/lib/auth/operatorView";
import type { User } from "@/lib/auth/types";
import { hideConversationForUser } from "./conversationHide";
import { conversationIdsMatch } from "./messageFilters";
import { emitSocialChange } from "./events";
import type { DirectMessage } from "./types";
import { scheduleMessageDeletionsSync } from "./messageSync";

const MESSAGES_KEY = "tkc_messages";

function readMessages(): DirectMessage[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    return raw ? (JSON.parse(raw) as DirectMessage[]) : [];
  } catch {
    return [];
  }
}

function writeMessages(messages: DirectMessage[]): void {
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
}

export function canDeleteMessage(message: DirectMessage, viewer: User): boolean {
  if (hasOperatorPrivileges(viewer)) {
    return true;
  }
  return message.senderId === viewer.id;
}

/** Sender can recall their own message for both sides. */
export function canRecallMessage(message: DirectMessage, viewer: User): boolean {
  return message.senderId === viewer.id;
}

export function deleteDirectMessage(messageId: string, viewer: User): boolean {
  const messages = readMessages();
  const message = messages.find((item) => item.id === messageId);
  if (!message || !canDeleteMessage(message, viewer)) {
    return false;
  }

  writeMessages(messages.filter((item) => item.id !== messageId));
  scheduleMessageDeletionsSync([messageId]);
  emitSocialChange();
  return true;
}

export function recallDirectMessage(messageId: string, viewer: User): boolean {
  const messages = readMessages();
  const message = messages.find((item) => item.id === messageId);
  if (!message || !canRecallMessage(message, viewer)) {
    return false;
  }

  writeMessages(messages.filter((item) => item.id !== messageId));
  scheduleMessageDeletionsSync([messageId]);
  emitSocialChange();
  return true;
}

/** Operator removes entire thread; members hide it from their inbox only. */
export function deleteConversationForUser(
  conversationId: string,
  viewer: User
): { mode: "deleted" | "hidden"; count: number } {
  const messages = readMessages().filter((message) =>
    conversationIdsMatch(message.conversationId, conversationId)
  );

  if (hasOperatorPrivileges(viewer)) {
    const ids = messages.map((message) => message.id);
    writeMessages(
      readMessages().filter(
        (message) => !conversationIdsMatch(message.conversationId, conversationId)
      )
    );
    if (ids.length > 0) {
      scheduleMessageDeletionsSync(ids);
      emitSocialChange();
    }
    return { mode: "deleted", count: ids.length };
  }

  hideConversationForUser(viewer.id, conversationId);
  emitSocialChange();
  return { mode: "hidden", count: messages.length };
}

export function deleteMessagesByPeerForOperator(
  peerId: string,
  viewer: User
): number {
  if (!hasOperatorPrivileges(viewer)) {
    return 0;
  }
  const all = readMessages();
  const targets = all.filter(
    (message) => message.senderId === peerId || message.recipientId === peerId
  );
  if (targets.length === 0) {
    return 0;
  }
  const targetIds = targets.map((message) => message.id);
  writeMessages(
    all.filter(
      (message) => message.senderId !== peerId && message.recipientId !== peerId
    )
  );
  scheduleMessageDeletionsSync(targetIds);
  emitSocialChange();
  return targetIds.length;
}
