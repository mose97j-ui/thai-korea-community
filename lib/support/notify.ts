import { findOperatorAccount } from "@/lib/auth/operator";
import { getUserNickname } from "@/lib/auth/profileImage";
import type { User } from "@/lib/auth/types";
import { createNotification } from "@/lib/social/notifications";
import type { SupportRequest } from "./types";

function operatorRecipientId(): string | null {
  return findOperatorAccount()?.id ?? null;
}

export function notifyOperatorNewSupportRequest(
  member: User,
  request: SupportRequest
): void {
  const operatorId = operatorRecipientId();
  if (!operatorId || operatorId === member.id) {
    return;
  }

  createNotification({
    userId: operatorId,
    type: "support",
    actorId: member.id,
    actorNickname: getUserNickname(member),
    supportId: request.id,
    preview: request.title,
  });
}

export function notifyMemberSupportReply(
  request: SupportRequest,
  operator: User,
  preview: string
): void {
  if (request.userId === operator.id) {
    return;
  }

  createNotification({
    userId: request.userId,
    type: "support",
    actorId: operator.id,
    actorNickname: getUserNickname(operator),
    supportId: request.id,
    preview: preview.slice(0, 80),
  });
}

export function notifyOperatorSupportFollowUp(
  request: SupportRequest,
  member: User,
  preview: string
): void {
  const operatorId = operatorRecipientId();
  if (!operatorId) {
    return;
  }

  createNotification({
    userId: operatorId,
    type: "support",
    actorId: member.id,
    actorNickname: getUserNickname(member),
    supportId: request.id,
    preview: preview.slice(0, 80),
  });
}
