import { hasOperatorPrivileges } from "@/lib/auth/operatorView";
import type { User } from "@/lib/auth/types";
import type { SupportRequest } from "@/lib/support/types";
import { SUPPORT_CHANGE_EVENT } from "@/lib/support/types";

export const SUPPORT_SYNC_EVENT = "tkc-support-sync";

const SUPPORT_KEY = "tkc_support_requests";
const SUPPORT_DELETE_TOMBSTONES_KEY = "tkc_support_delete_tombstones";
const DELETE_TOMBSTONE_TTL_MS = 24 * 60 * 60 * 1000;

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

function readDeleteTombstones(): Record<string, number> {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = localStorage.getItem(SUPPORT_DELETE_TOMBSTONES_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    const now = Date.now();
    const next: Record<string, number> = {};
    for (const [id, expiresAt] of Object.entries(parsed)) {
      if (typeof expiresAt === "number" && expiresAt > now) {
        next[id] = expiresAt;
      }
    }
    return next;
  } catch {
    return {};
  }
}

function writeDeleteTombstones(tombstones: Record<string, number>): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(
    SUPPORT_DELETE_TOMBSTONES_KEY,
    JSON.stringify(tombstones)
  );
}

function isDeletedTombstone(id: string): boolean {
  const tombstones = readDeleteTombstones();
  return typeof tombstones[id] === "number";
}

export function rememberDeletedSupportIds(ids: string[]): void {
  if (typeof window === "undefined" || ids.length === 0) {
    return;
  }
  const tombstones = readDeleteTombstones();
  const expiresAt = Date.now() + DELETE_TOMBSTONE_TTL_MS;
  for (const id of ids) {
    if (id) {
      tombstones[id] = expiresAt;
    }
  }
  writeDeleteTombstones(tombstones);
}

function clearDeletedSupportIds(ids: string[]): void {
  if (typeof window === "undefined" || ids.length === 0) {
    return;
  }
  const tombstones = readDeleteTombstones();
  let changed = false;
  for (const id of ids) {
    if (id in tombstones) {
      delete tombstones[id];
      changed = true;
    }
  }
  if (changed) {
    writeDeleteTombstones(tombstones);
  }
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

function pickNewerSupportRequest(
  local: SupportRequest,
  remote: SupportRequest
): SupportRequest {
  const localTime = new Date(local.updatedAt).getTime();
  const remoteTime = new Date(remote.updatedAt).getTime();
  if (remoteTime !== localTime) {
    return remoteTime > localTime ? remote : local;
  }
  // When timestamps tie, trust remote payload so read/delete updates
  // are not dropped due message-length heuristics.
  return remote;
}

export function mergeRemoteSupportRequests(remote: SupportRequest[]): boolean {
  if (remote.length === 0) {
    return false;
  }

  const filteredRemote = remote.filter((request) => !isDeletedTombstone(request.id));
  if (filteredRemote.length === 0) {
    return false;
  }

  const merged = new Map(readRequests().map((item) => [item.id, item]));
  let changed = false;

  for (const request of filteredRemote) {
    const existing = merged.get(request.id);
    const next = existing ? pickNewerSupportRequest(existing, request) : request;
    if (!existing || !isSameRequest(existing, next)) {
      merged.set(request.id, next);
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
    clearDeletedSupportIds([request.id]);
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
  const operator = hasOperatorPrivileges(user);
  const gmail = user.gmail?.trim().toLowerCase();
  if (!operator && !gmail) {
    return 0;
  }

  const query = operator
    ? "scope=operator"
    : `gmail=${encodeURIComponent(gmail!)}`;

  let count = 0;

  try {
    const response = await fetch(`/api/support?${query}`, {
      cache: "no-store",
      headers: { Pragma: "no-cache" },
    });
    if (response.ok) {
      const payload = (await response.json()) as {
        requests?: SupportRequest[];
      };
      const requests = payload.requests ?? [];
      if (requests.length > 0 && mergeRemoteSupportRequests(requests)) {
        count = requests.length;
      } else if (requests.length > 0) {
        count = requests.length;
      }
    }
  } catch {
    // Fall through to client read.
  }

  const fromClient = await fetchSupportRequestsFromSupabase(user);
  return Math.max(count, fromClient);
}

/** Client-side Supabase read when service role API is unavailable. */
export async function fetchSupportRequestsFromSupabase(user: User): Promise<number> {
  if (typeof window === "undefined") {
    return 0;
  }

  const operator = hasOperatorPrivileges(user);
  const gmail = user.gmail?.trim().toLowerCase();
  if (!operator && !gmail) {
    return 0;
  }

  try {
    const {
      fetchAllSupportRequestsClient,
      fetchSupportRequestsForGmailClient,
    } = await import("@/lib/supabase/supportRequestsClient");
    const requests = operator
      ? await fetchAllSupportRequestsClient()
      : await fetchSupportRequestsForGmailClient(gmail!);
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
  const pulled = await fetchSupportRequestsForUser(user);
  await pushAllLocalSupportToServer();
  return pulled;
}

export async function syncSupportDeletionsToServer(ids: string[]): Promise<void> {
  if (ids.length === 0 || typeof window === "undefined") {
    return;
  }

  rememberDeletedSupportIds(ids);

  try {
    const response = await fetch("/api/support/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
      cache: "no-store",
    });
    if (response.ok) {
      dispatchSupportSyncEvent();
    }
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
