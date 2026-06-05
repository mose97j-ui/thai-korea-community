import { getUserNickname } from "@/lib/auth/profileImage";
import { hasOperatorPrivileges } from "@/lib/auth/operatorView";
import type { User } from "@/lib/auth/types";
import type {
  CreateSupportInput,
  SupportMessage,
  SupportRequest,
  SupportStatus,
} from "./types";
import { classifySupportCategory } from "./classify";
import {
  notifyMemberSupportReply,
  notifyOperatorNewSupportRequest,
  notifyOperatorSupportFollowUp,
} from "./notify";
import { scheduleSupportRequestSync } from "./supportSync";
import { deriveSupportTitle } from "./title";
import { SUPPORT_CHANGE_EVENT } from "./types";

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

function syncRequestToServer(request: SupportRequest): void {
  scheduleSupportRequestSync(request);
}

function sortRequests(requests: SupportRequest[]): SupportRequest[] {
  return [...requests].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function getSupportRequestsForUser(userId: string): SupportRequest[] {
  return sortRequests(readRequests().filter((item) => item.userId === userId));
}

export function getAllSupportRequests(): SupportRequest[] {
  return sortRequests(readRequests());
}

export function getSupportRequestById(id: string): SupportRequest | null {
  return readRequests().find((item) => item.id === id) ?? null;
}

export function createSupportRequest(
  user: User,
  input: CreateSupportInput
): SupportRequest {
  const now = new Date().toISOString();
  const body = input.content.trim();
  const category = classifySupportCategory(body);
  const title = deriveSupportTitle(body, input.locale);

  const initialMessage: SupportMessage = {
    id: crypto.randomUUID(),
    authorId: user.id,
    authorNickname: getUserNickname(user),
    authorProfileImage: user.profileImage,
    isOperator: false,
    content: body,
    createdAt: now,
  };

  const request: SupportRequest = {
    id: crypto.randomUUID(),
    userId: user.id,
    userNickname: getUserNickname(user),
    userProfileImage: user.profileImage,
    userGmail: user.gmail,
    category,
    title,
    status: "open",
    messages: [initialMessage],
    unreadByUser: false,
    unreadByOperator: true,
    createdAt: now,
    updatedAt: now,
  };

  const requests = readRequests();
  requests.push(request);
  writeRequests(requests);
  syncRequestToServer(request);
  notifyOperatorNewSupportRequest(user, request);
  return request;
}

export function addSupportReply(
  requestId: string,
  author: User,
  content: string
): SupportRequest | null {
  const trimmed = content.trim();
  if (!trimmed) {
    return null;
  }

  const requests = readRequests();
  const index = requests.findIndex((item) => item.id === requestId);
  if (index === -1) {
    return null;
  }

  const current = requests[index];
  if (current.status === "closed") {
    return null;
  }

  const operator = hasOperatorPrivileges(author);
  if (!operator && author.id !== current.userId) {
    return null;
  }

  const message: SupportMessage = {
    id: crypto.randomUUID(),
    authorId: author.id,
    authorNickname: getUserNickname(author),
    authorProfileImage: author.profileImage,
    isOperator: operator,
    content: trimmed,
    createdAt: new Date().toISOString(),
  };

  const updated: SupportRequest = {
    ...current,
    messages: [...current.messages, message],
    status: operator ? "answered" : "open",
    unreadByUser: operator,
    unreadByOperator: !operator,
    updatedAt: message.createdAt,
  };

  requests[index] = updated;
  writeRequests(requests);
  syncRequestToServer(updated);

  if (operator) {
    notifyMemberSupportReply(updated, author, trimmed);
  } else {
    notifyOperatorSupportFollowUp(updated, author, trimmed);
  }

  return updated;
}

export function updateSupportStatus(
  requestId: string,
  status: SupportStatus,
  operator: User
): SupportRequest | null {
  if (!hasOperatorPrivileges(operator)) {
    return null;
  }

  const requests = readRequests();
  const index = requests.findIndex((item) => item.id === requestId);
  if (index === -1) {
    return null;
  }

  const updated: SupportRequest = {
    ...requests[index],
    status,
    updatedAt: new Date().toISOString(),
    unreadByUser: status === "answered" || status === "closed",
    unreadByOperator: false,
  };

  requests[index] = updated;
  writeRequests(requests);
  syncRequestToServer(updated);
  return updated;
}

export function markSupportRequestRead(
  requestId: string,
  viewer: User
): SupportRequest | null {
  const requests = readRequests();
  const index = requests.findIndex((item) => item.id === requestId);
  if (index === -1) {
    return null;
  }

  const current = requests[index];
  const operator = hasOperatorPrivileges(viewer);
  const canView =
    operator || current.userId === viewer.id;
  if (!canView) {
    return null;
  }

  const updated: SupportRequest = {
    ...current,
    unreadByUser: operator ? current.unreadByUser : false,
    unreadByOperator: operator ? false : current.unreadByOperator,
    updatedAt: new Date().toISOString(),
  };

  if (
    updated.unreadByUser === current.unreadByUser &&
    updated.unreadByOperator === current.unreadByOperator
  ) {
    return current;
  }

  requests[index] = updated;
  writeRequests(requests);
  syncRequestToServer(updated);
  return updated;
}

export function getUnreadSupportCountForUser(userId: string): number {
  return readRequests().filter(
    (item) => item.userId === userId && item.unreadByUser
  ).length;
}

export function getUnreadSupportCountForOperator(): number {
  return readRequests().filter((item) => item.unreadByOperator).length;
}

export function getOpenSupportCount(): number {
  return readRequests().filter((item) => item.status === "open").length;
}
