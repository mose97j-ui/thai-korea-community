import {
  findOperatorAccount,
  getOperatorDefaults,
  getOperatorRecipientId,
  isOperatorUser,
} from "@/lib/auth/operator";
import { hasOperatorPrivileges } from "@/lib/auth/operatorView";
import { findUserByGmail, findUserById } from "@/lib/auth/storage";
import type { User } from "@/lib/auth/types";
import type { DirectMessage } from "@/lib/social/types";

const OPERATOR_GMAIL = getOperatorDefaults().gmail.toLowerCase();

/** Stable key so operator UUID vs tkc-operator still share one thread. */
export function getParticipantKey(userId: string, gmail?: string): string {
  const normalized = gmail?.trim().toLowerCase();
  if (normalized === OPERATOR_GMAIL) {
    return `gmail:${OPERATOR_GMAIL}`;
  }
  if (normalized) {
    return `gmail:${normalized}`;
  }
  return `id:${userId}`;
}

const CONVERSATION_SEP = "\u0001";

export function getConversationId(
  userIdA: string,
  userIdB: string,
  gmailA?: string,
  gmailB?: string
): string {
  return [getParticipantKey(userIdA, gmailA), getParticipantKey(userIdB, gmailB)]
    .sort()
    .join(CONVERSATION_SEP);
}

export function getConversationIdBetweenUsers(userA: User, userB: User): string {
  return getConversationId(userA.id, userB.id, userA.gmail, userB.gmail);
}

export function resolveUserGmail(userId: string): string | undefined {
  const user = findUserById(userId);
  return user?.gmail?.trim().toLowerCase();
}

export function resolveThreadPeer(peerId: string): User | undefined {
  const direct = findUserById(peerId);
  if (direct) {
    return direct;
  }
  if (peerId.startsWith("gmail:")) {
    return findUserByGmail(peerId.slice(6));
  }
  return undefined;
}

export function resolvePeerUserId(peerId: string): string {
  const user = findUserById(peerId);
  if (user) {
    return user.id;
  }

  if (peerId.startsWith("gmail:")) {
    const gmail = peerId.slice(6);
    return findUserByGmail(gmail)?.id ?? peerId;
  }

  return peerId;
}

/** Map legacy conversation ids to stable inbox / thread links. */
export function remapPeerIdForViewer(peerId: string, viewer: User): string {
  const peer = findUserById(peerId);

  if (hasOperatorPrivileges(viewer)) {
    if (peer && isOperatorUser(peer)) {
      return viewer.id;
    }
    const peerGmail =
      peer?.gmail?.toLowerCase() ??
      (peerId.startsWith("gmail:") ? peerId.slice(6).toLowerCase() : resolveUserGmail(peerId));
    if (peerGmail === OPERATOR_GMAIL) {
      return viewer.id;
    }
    if (peer) {
      return peer.id;
    }
    if (peerId.startsWith("gmail:")) {
      return findUserByGmail(peerId.slice(6))?.id ?? peerId;
    }
    return peerId;
  }

  if (peer) {
    return peer.id;
  }

  if (peerId.startsWith("gmail:")) {
    return findUserByGmail(peerId.slice(6))?.id ?? peerId;
  }

  const operatorId = getOperatorRecipientId();
  if (
    peerId === operatorId ||
    peerId === getOperatorDefaults().id ||
    resolveUserGmail(peerId) === OPERATOR_GMAIL ||
    findOperatorAccount()?.id === peerId
  ) {
    return operatorId;
  }

  return peerId;
}

export function getMessageParticipantKey(userId: string): string {
  const user = findUserById(userId);
  return getParticipantKey(userId, user?.gmail);
}

/** Match inbox rows when operator UUID and legacy `tkc-operator` share a thread. */
export function messageInvolvesUser(message: DirectMessage, viewer: User): boolean {
  const viewerKey = getParticipantKey(viewer.id, viewer.gmail);
  return (
    getMessageParticipantKey(message.senderId) === viewerKey ||
    getMessageParticipantKey(message.recipientId) === viewerKey
  );
}

export function messageIsUnreadForUser(message: DirectMessage, viewer: User): boolean {
  if (message.readAt) {
    return false;
  }
  const viewerKey = getParticipantKey(viewer.id, viewer.gmail);
  return getMessageParticipantKey(message.recipientId) === viewerKey;
}

export function getPeerId(conversationId: string, currentUserId: string): string {
  const parts = conversationId.split(CONVERSATION_SEP);
  if (parts.length !== 2) {
    return conversationId;
  }
  const viewerKey = getParticipantKey(
    currentUserId,
    resolveUserGmail(currentUserId)
  );
  const otherKey = parts[0] === viewerKey ? parts[1] : parts[0];
  if (otherKey.startsWith("gmail:")) {
    return findUserByGmail(otherKey.slice(6))?.id ?? otherKey;
  }
  if (otherKey.startsWith("id:")) {
    return otherKey.slice(3);
  }
  return otherKey;
}
