import { findOperatorAccount, getOperatorDefaults } from "@/lib/auth/operator";
import { findUserByGmail, findUserById } from "@/lib/auth/storage";
import type { User } from "@/lib/auth/types";
import type { DirectMessage } from "@/lib/social/types";
import { emitSocialChange } from "./events";

export const MESSAGES_SYNC_EVENT = "tkc-messages-sync";

const MESSAGES_KEY = "tkc_messages";

function dispatchMessagesSyncEvent() {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(MESSAGES_SYNC_EVENT));
}

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

function isSameMessage(a: DirectMessage, b: DirectMessage): boolean {
  return (
    a.id === b.id &&
    a.content === b.content &&
    a.readAt === b.readAt &&
    a.createdAt === b.createdAt
  );
}

export function mergeRemoteMessages(remote: DirectMessage[]): boolean {
  if (remote.length === 0) {
    return false;
  }

  const merged = new Map(readMessages().map((message) => [message.id, message]));
  let changed = false;

  for (const message of remote) {
    const existing = merged.get(message.id);
    if (!existing || !isSameMessage(existing, message)) {
      merged.set(message.id, message);
      changed = true;
    }
  }

  if (!changed) {
    return false;
  }

  writeMessages(
    [...merged.values()].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
  );
  dispatchMessagesSyncEvent();
  return true;
}

function resolveGmail(userId: string): string | null {
  const user = findUserById(userId);
  const gmail = user?.gmail?.trim().toLowerCase();
  if (gmail) {
    return gmail;
  }
  const operator = findOperatorAccount();
  if (operator && operator.id === userId) {
    return operator.gmail.trim().toLowerCase();
  }
  const defaults = getOperatorDefaults();
  if (userId === defaults.id) {
    return defaults.gmail.toLowerCase();
  }
  return null;
}

export async function syncDirectMessageToServer(
  message: DirectMessage
): Promise<boolean> {
  const senderGmail = resolveGmail(message.senderId);
  const recipientGmail = resolveGmail(message.recipientId);

  if (!senderGmail || !recipientGmail) {
    return false;
  }

  try {
    const response = await fetch("/api/messages/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        senderGmail,
        recipientGmail,
      }),
      cache: "no-store",
    });

    if (response.ok) {
      dispatchMessagesSyncEvent();
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export function scheduleDirectMessageSync(message: DirectMessage): void {
  if (typeof window === "undefined") {
    return;
  }
  void syncDirectMessageToServer(message);
}

export async function fetchDirectMessagesForUser(user: User): Promise<number> {
  const gmail = user.gmail?.trim().toLowerCase();
  if (!gmail) {
    return 0;
  }

  try {
    const response = await fetch(
      `/api/messages?gmail=${encodeURIComponent(gmail)}`,
      { cache: "no-store", headers: { Pragma: "no-cache" } }
    );
    if (!response.ok) {
      return 0;
    }

    const payload = (await response.json()) as {
      messages?: DirectMessage[];
      meta?: { configured?: boolean };
    };

    const messages = payload.messages ?? [];
    if (messages.length === 0) {
      return 0;
    }

    mergeRemoteMessages(messages);
    return messages.length;
  } catch {
    return 0;
  }
}

/** Client-side Supabase read when service role API is unavailable on Vercel. */
export async function fetchDirectMessagesFromSupabase(user: User): Promise<number> {
  const gmail = user.gmail?.trim().toLowerCase();
  if (!gmail || typeof window === "undefined") {
    return 0;
  }

  try {
    const { fetchDirectMessagesForGmailClient } = await import(
      "@/lib/supabase/directMessagesClient"
    );
    const messages = await fetchDirectMessagesForGmailClient(gmail);
    if (messages.length === 0) {
      return 0;
    }
    mergeRemoteMessages(messages);
    return messages.length;
  } catch {
    return 0;
  }
}

export async function pushAllLocalMessagesToServer(): Promise<number> {
  let synced = 0;
  for (const message of readMessages()) {
    if (await syncDirectMessageToServer(message)) {
      synced += 1;
    }
  }
  return synced;
}

export async function pullMessagesForUser(user: User): Promise<number> {
  await pushAllLocalMessagesToServer();
  const fromApi = await fetchDirectMessagesForUser(user);
  const fromClient = await fetchDirectMessagesFromSupabase(user);
  return Math.max(fromApi, fromClient);
}

export async function syncMessageDeletionsToServer(ids: string[]): Promise<void> {
  if (ids.length === 0 || typeof window === "undefined") {
    return;
  }

  try {
    await fetch("/api/messages/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
      cache: "no-store",
    });
    dispatchMessagesSyncEvent();
  } catch {
    // Local delete still applies.
  }
}

export function scheduleMessageDeletionsSync(ids: string[]): void {
  if (typeof window === "undefined" || ids.length === 0) {
    return;
  }
  void syncMessageDeletionsToServer(ids);
}
