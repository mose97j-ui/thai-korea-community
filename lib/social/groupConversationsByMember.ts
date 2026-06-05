import { findUserById } from "@/lib/auth/storage";
import type { User } from "@/lib/auth/types";
import { remapPeerIdForViewer } from "@/lib/social/conversation";
import type { ConversationPreview } from "@/lib/social/types";

export type MessageMemberGroup = {
  peerId: string;
  peerNickname: string;
  peerGmail: string;
  peerPersonalCode: string;
  peerProfileImage?: string;
  threads: ConversationPreview[];
  unreadCount: number;
  latestMessageAt: string;
};

export function groupConversationsByMember(
  conversations: ConversationPreview[],
  viewer: User
): MessageMemberGroup[] {
  const map = new Map<string, MessageMemberGroup>();

  for (const thread of conversations) {
    const peerId = remapPeerIdForViewer(thread.peerId, viewer);
    let group = map.get(peerId);

    if (!group) {
      const peer = findUserById(peerId);
      group = {
        peerId,
        peerNickname: peer?.nickname || peer?.name || thread.peerNickname,
        peerGmail: peer?.gmail ?? "",
        peerPersonalCode: peer?.personalCode ?? "",
        peerProfileImage: peer?.profileImage ?? thread.peerProfileImage,
        threads: [],
        unreadCount: 0,
        latestMessageAt: thread.lastMessageAt,
      };
      map.set(peerId, group);
    }

    group.threads.push({ ...thread, peerId });
    group.unreadCount += thread.unreadCount;
    if (thread.lastMessageAt > group.latestMessageAt) {
      group.latestMessageAt = thread.lastMessageAt;
    }
  }

  for (const group of map.values()) {
    group.threads.sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
  }

  return [...map.values()].sort((a, b) =>
    b.latestMessageAt.localeCompare(a.latestMessageAt)
  );
}
