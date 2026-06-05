import { hasOperatorPrivileges } from "@/lib/auth/operatorView";
import type { User } from "@/lib/auth/types";
import type { SupportMessage, SupportRequest } from "./types";
import { SUPPORT_CHANGE_EVENT } from "./types";
import { deriveSupportTitle } from "./title";
import {
  rememberDeletedSupportIds,
  scheduleSupportDeletionsSync,
  scheduleSupportRequestSync,
} from "./supportSync";

const SUPPORT_KEY = "tkc_support_requests";

function notifyChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SUPPORT_CHANGE_EVENT));
  }
}

function readRequests(): SupportRequest[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(SUPPORT_KEY);
    return raw ? (JSON.parse(raw) as SupportRequest[]) : [];
  } catch {
    return [];
  }
}

function writeRequests(requests: SupportRequest[]): void {
  localStorage.setItem(SUPPORT_KEY, JSON.stringify(requests));
  notifyChange();
}

function canManageRequest(request: SupportRequest, viewer: User): boolean {
  return hasOperatorPrivileges(viewer) || request.userId === viewer.id;
}

export function canDeleteSupportMessage(
  request: SupportRequest,
  message: SupportMessage,
  viewer: User
): boolean {
  if (!canManageRequest(request, viewer)) {
    return false;
  }
  if (hasOperatorPrivileges(viewer)) {
    return true;
  }
  return message.authorId === viewer.id;
}

export function deleteSupportRequest(
  requestId: string,
  viewer: User
): boolean {
  const requests = readRequests();
  const request = requests.find((item) => item.id === requestId);
  if (!request || !canManageRequest(request, viewer)) {
    return false;
  }

  writeRequests(requests.filter((item) => item.id !== requestId));
  rememberDeletedSupportIds([requestId]);
  scheduleSupportDeletionsSync([requestId]);
  return true;
}

export function deleteSupportRequestsByMember(
  memberId: string,
  viewer: User
): number {
  if (!hasOperatorPrivileges(viewer)) {
    return 0;
  }
  const requests = readRequests();
  const targets = requests.filter((item) => item.userId === memberId);
  if (targets.length === 0) {
    return 0;
  }
  const targetIds = targets.map((item) => item.id);
  writeRequests(requests.filter((item) => item.userId !== memberId));
  rememberDeletedSupportIds(targetIds);
  scheduleSupportDeletionsSync(targetIds);
  return targetIds.length;
}

export function deleteSupportMessage(
  requestId: string,
  messageId: string,
  viewer: User
): boolean {
  const requests = readRequests();
  const index = requests.findIndex((item) => item.id === requestId);
  if (index === -1) {
    return false;
  }

  const current = requests[index];
  const message = current.messages.find((item) => item.id === messageId);
  if (!message || !canDeleteSupportMessage(current, message, viewer)) {
    return false;
  }

  if (current.messages.length <= 1) {
    return deleteSupportRequest(requestId, viewer);
  }

  const messages = current.messages.filter((item) => item.id !== messageId);
  const last = messages[messages.length - 1];
  const updated: SupportRequest = {
    ...current,
    messages,
    title: deriveSupportTitle(messages[0]?.content ?? current.title),
    updatedAt: last?.createdAt ?? current.updatedAt,
  };

  requests[index] = updated;
  writeRequests(requests);
  scheduleSupportRequestSync(updated);
  return true;
}
