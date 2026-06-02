export function getConversationId(userIdA: string, userIdB: string): string {
  return [userIdA, userIdB].sort().join(":");
}

export function getPeerId(conversationId: string, currentUserId: string): string {
  const [a, b] = conversationId.split(":");
  return a === currentUserId ? b : a;
}
