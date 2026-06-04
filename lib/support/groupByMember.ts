import type { SupportRequest } from "./types";

export type SupportMemberGroup = {
  userId: string;
  userNickname: string;
  userGmail: string;
  userProfileImage?: string;
  requests: SupportRequest[];
  unreadCount: number;
  latestUpdatedAt: string;
};

/** Operator inbox: one section per member (newest activity first). */
export function groupSupportRequestsByMember(
  requests: SupportRequest[]
): SupportMemberGroup[] {
  const map = new Map<string, SupportMemberGroup>();

  for (const request of requests) {
    let group = map.get(request.userId);
    if (!group) {
      group = {
        userId: request.userId,
        userNickname: request.userNickname,
        userGmail: request.userGmail,
        userProfileImage: request.userProfileImage,
        requests: [],
        unreadCount: 0,
        latestUpdatedAt: request.updatedAt,
      };
      map.set(request.userId, group);
    }

    group.requests.push(request);
    if (request.unreadByOperator) {
      group.unreadCount += 1;
    }
    if (request.updatedAt > group.latestUpdatedAt) {
      group.latestUpdatedAt = request.updatedAt;
    }
  }

  for (const group of map.values()) {
    group.requests.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  return [...map.values()].sort((a, b) =>
    b.latestUpdatedAt.localeCompare(a.latestUpdatedAt)
  );
}
