import { mergeRemoteMembers } from "@/lib/auth/storage";
import type { User } from "@/lib/auth/types";

export const MEMBERS_SYNC_EVENT = "tkc-members-sync";

function dispatchMembersSyncEvent() {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(MEMBERS_SYNC_EVENT));
}

/** Push a member record to the shared Supabase directory (no password). */
export async function syncMemberToServer(user: User): Promise<boolean> {
  try {
    const response = await fetch("/api/members/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: user.id,
        name: user.name,
        nickname: user.nickname,
        gender: user.gender,
        profileImage: user.profileImage,
        birthDate: user.birthDate,
        hometown: user.hometown,
        gmail: user.gmail,
        koreanPhone: user.koreanPhone,
        personalCode: user.personalCode,
        referredBy: user.referredBy,
        role: user.role,
        premiumUntil: user.premiumUntil,
        restriction: user.restriction,
        authProvider: user.authProvider ?? "local",
        createdAt: user.createdAt,
      }),
    });

    return response.ok;
  } catch {
    return false;
  }
}

/** Pull all members from server and merge into local storage for operator tools. */
export async function fetchAndMergeMembersFromServer(): Promise<number> {
  try {
    const response = await fetch("/api/members", { cache: "no-store" });
    if (!response.ok) {
      return 0;
    }

    const payload = (await response.json()) as { members?: User[] };
    const members = payload.members ?? [];
    if (members.length === 0) {
      return 0;
    }

    mergeRemoteMembers(members);
    dispatchMembersSyncEvent();
    return members.length;
  } catch {
    return 0;
  }
}
