import { findOperatorAccount, getOperatorDefaults } from "@/lib/auth/operator";
import { findUserByGmail, findUserById } from "@/lib/auth/storage";
import {
  getParticipantKey,
  resolveUserGmail,
} from "@/lib/social/conversation";
import type { DirectMessage } from "@/lib/social/types";

const CONVERSATION_SEP = "\u0001";
const OPERATOR_GMAIL = getOperatorDefaults().gmail.toLowerCase();

function gmailFromParticipantKey(key: string): string | null {
  if (!key.startsWith("gmail:")) {
    return null;
  }
  return key.slice(6).toLowerCase();
}

/** Resolve Gmail for sync — works for legacy local-only messages. */
export function resolveMessagePartyGmail(
  message: DirectMessage,
  userId: string
): string | null {
  const user = findUserById(userId);
  const direct = user?.gmail?.trim().toLowerCase();
  if (direct) {
    return direct;
  }

  const operator = findOperatorAccount();
  if (operator && operator.id === userId) {
    return operator.gmail.trim().toLowerCase();
  }

  const defaults = getOperatorDefaults();
  if (userId === defaults.id) {
    return defaults.gmail.toLowerCase();
  }

  const participantKey = getParticipantKey(userId, resolveUserGmail(userId));
  const keyGmail = gmailFromParticipantKey(participantKey);
  if (keyGmail) {
    return keyGmail;
  }

  const parts = message.conversationId.split(CONVERSATION_SEP);
  if (parts.length === 2) {
    for (const part of parts) {
      const gmail = gmailFromParticipantKey(part);
      if (!gmail) {
        continue;
      }
      const match = findUserByGmail(gmail);
      if (match?.id === userId) {
        return gmail;
      }
    }

    if (message.senderId === userId || message.recipientId === userId) {
      const senderKey = getParticipantKey(
        message.senderId,
        resolveUserGmail(message.senderId)
      );
      const recipientKey = getParticipantKey(
        message.recipientId,
        resolveUserGmail(message.recipientId)
      );
      const ownKey = message.senderId === userId ? senderKey : recipientKey;
      const ownGmail = gmailFromParticipantKey(ownKey);
      if (ownGmail) {
        return ownGmail;
      }

      const otherGmail = parts
        .map(gmailFromParticipantKey)
        .find((gmail) => gmail && gmail !== OPERATOR_GMAIL);
      if (otherGmail && message.recipientId === userId) {
        return otherGmail;
      }
      if (parts.some((p) => p === `gmail:${OPERATOR_GMAIL}`) && userId === message.senderId) {
        return OPERATOR_GMAIL;
      }
    }
  }

  return null;
}
