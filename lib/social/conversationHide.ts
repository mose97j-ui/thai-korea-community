const HIDDEN_KEY = "tkc_hidden_conversations";

type HiddenStore = Record<string, string[]>;

function readStore(): HiddenStore {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = localStorage.getItem(HIDDEN_KEY);
    return raw ? (JSON.parse(raw) as HiddenStore) : {};
  } catch {
    return {};
  }
}

function writeStore(store: HiddenStore): void {
  localStorage.setItem(HIDDEN_KEY, JSON.stringify(store));
}

export function hideConversationForUser(userId: string, conversationId: string): void {
  const store = readStore();
  const list = store[userId] ?? [];
  if (!list.includes(conversationId)) {
    store[userId] = [...list, conversationId];
    writeStore(store);
  }
}

export function unhideConversationForUser(userId: string, conversationId: string): void {
  const store = readStore();
  const list = store[userId];
  if (!list?.includes(conversationId)) {
    return;
  }
  store[userId] = list.filter((id) => id !== conversationId);
  writeStore(store);
}

export function isConversationHiddenForUser(
  userId: string,
  conversationId: string
): boolean {
  return (readStore()[userId] ?? []).includes(conversationId);
}
