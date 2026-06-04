/** Match inbox rows when conversation id uses legacy dual-key format. */
export function conversationIdsMatch(storedId: string, activeId: string): boolean {
  if (storedId === activeId) {
    return true;
  }
  const keys = new Set(
    activeId.includes("\u0001") ? activeId.split("\u0001") : [activeId]
  );
  if (!storedId.includes("\u0001")) {
    return false;
  }
  const parts = storedId.split("\u0001");
  return parts.length === 2 && keys.has(parts[0]) && keys.has(parts[1]);
}
