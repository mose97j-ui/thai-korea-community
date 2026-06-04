import { hasOperatorPrivileges } from "@/lib/auth/operatorView";
import type { User } from "@/lib/auth/types";
import type { SupportRequest } from "@/lib/support/types";
import { SUPPORT_CHANGE_EVENT } from "@/lib/support/types";

export const SUPPORT_SYNC_EVENT = "tkc-support-sync";

const SUPPORT_KEY = "tkc_support_requests";

function dispatchSupportSyncEvent() {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(SUPPORT_SYNC_EVENT));
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
}

function isSameRequest(a: SupportRequest, b: SupportRequest): boolean {
  return (
    a.id === b.id &&
    a.updatedAt === b.updatedAt &&
    a.status === b.status &&
    a.messages.length === b.messages.length &&
    a.unreadByOperator === b.unreadByOperator &&
    a.unreadByUser === b.unreadByUser
  );
}

export function mergeRemoteSupportRequests(remote: SupportRequest[]): boolean {
  if (remote.length === 0) {
    return false;
  }

  const merged = new Map(readRequests().map((item) => [item.id, item]));
  let changed = false;

  for (const request of remote) {
    const existing = merged.get(request.id);
    if (!existing || !isSameRequest(existing, request)) {
      merged.set(request.id, request);
      changed = true;
    }
  }

  if (!changed) {
    return false;
  }

  writeRequests([...merged.values()]);
  dispatchSupportSyncEvent();
  window.dispatchEvent(new Event(SUPPORT_CHANGE_EVENT));
  return true;
}

export async function syncSupportRequestToServer(
  request: SupportRequest
): Promise<boolean> {
  const gmail = request.userGmail?.trim().toLowerCase();
  if (!gmail || !gmail.endsWith("@gmail.com")) {
    return false;
  }

  try {
    const response = await fetch("/api/support/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request }),
      cache: "no-store",
    });
    if (response.ok) {
      dispatchSupportSyncEvent();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function scheduleSupportRequestSync(request: SupportRequest): void {
  if (typeof window === "undefined") {
    return;
  }
  void syncSupportRequestToServer(request);
}

export async function fetchSupportRequestsForUser(
  user: User
): Promise<number> {
  const gmail = user.gmail?.trim().toLowerCase();
  if (!gmail) {
    return 0;
  }

  const operator = hasOperatorPrivileges(user);
  const query = operator
    ? "scope=operator"
    : `gmail=${encodeURIComponent(gmail)}`;

  try {
    const response = await fetch(`/api/support?${query}`, {
      cache: "no-store",
      headers: { Pragma: "no-cache" },
    });
    if (!response.ok) {
      return 0;
    }

    const payload = (await response.json()) as {
      requests?: SupportRequest[];
    };
    const requests = payload.requests ?? [];
    if (requests.length === 0) {
      return 0;
    }

    mergeRemoteSupportRequests(requests);
    return requests.length;
  } catch {
    return 0;
  }
}

export async function pushAllLocalSupportToServer(): Promise<number> {
  const { getAllSupportRequests } = await import("@/lib/support/storage");
  let synced = 0;
  for (const request of getAllSupportRequests()) {
    if (await syncSupportRequestToServer(request)) {
      synced += 1;
    }
  }
  return synced;
}

export async function pullSupportRequestsForUser(user: User): Promise<number> {
  await pushAllLocalSupportToServer();
  return fetchSupportRequestsForUser(user);
}

export async function syncSupportDeletionsToServer(ids: string[]): Promise<void> {
  if (ids.length === 0 || typeof window === "undefined") {
    return;
  }

  try {
    await fetch("/api/support/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
      cache: "no-store",
    });
    dispatchSupportSyncEvent();
  } catch {
    // Local delete still applies.
  }
}

export function scheduleSupportDeletionsSync(ids: string[]): void {
  if (typeof window === "undefined") {
    return;
  }
  void syncSupportDeletionsToServer(ids);
}
