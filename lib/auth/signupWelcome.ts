"use client";

const SIGNUP_WELCOME_PENDING_KEY = "tkc_signup_welcome_pending";

type PendingStore = Record<string, boolean>;

function readStore(): PendingStore {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = localStorage.getItem(SIGNUP_WELCOME_PENDING_KEY);
    return raw ? (JSON.parse(raw) as PendingStore) : {};
  } catch {
    return {};
  }
}

function writeStore(store: PendingStore): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(SIGNUP_WELCOME_PENDING_KEY, JSON.stringify(store));
}

/** Mark newly signed-up account to show one-time welcome modal after login. */
export function markSignupWelcomePending(userId: string): void {
  if (!userId || typeof window === "undefined") {
    return;
  }
  const store = readStore();
  store[userId] = true;
  writeStore(store);
}

export function isSignupWelcomePending(userId: string): boolean {
  if (!userId || typeof window === "undefined") {
    return false;
  }
  return Boolean(readStore()[userId]);
}

export function clearSignupWelcomePending(userId: string): void {
  if (!userId || typeof window === "undefined") {
    return;
  }
  const store = readStore();
  if (!store[userId]) {
    return;
  }
  delete store[userId];
  writeStore(store);
}
