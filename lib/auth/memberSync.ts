import { isOperatorUser } from "@/lib/auth/operator";
import { getSessionUser, mergeRemoteMembers } from "@/lib/auth/storage";
import type { User } from "@/lib/auth/types";

export const MEMBERS_SYNC_EVENT = "tkc-members-sync";

const SYNC_DEBOUNCE_MS = 350;
const syncTimers = new Map<string, ReturnType<typeof setTimeout>>();

function dispatchMembersSyncEvent() {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(MEMBERS_SYNC_EVENT));
}

function buildSyncPayload(user: User) {
  const session = getSessionUser();
  const byOperatorSession = isOperatorUser(session);

  const base = {
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
    authProvider: user.authProvider ?? "local",
    createdAt: user.createdAt,
  };

  if (!byOperatorSession) {
    return base;
  }

  return {
    ...base,
    role: user.role,
    premiumUntil: user.premiumUntil,
    restriction: user.restriction,
    syncAsOperator: true,
    operatorGmail: session?.gmail,
  };
}

/** Push a member record to the shared Supabase directory (debounced, no password). */
export async function syncMemberToServer(user: User): Promise<boolean> {
  try {
    const response = await fetch("/api/members/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildSyncPayload(user)),
    });

    if (response.ok) {
      dispatchMembersSyncEvent();
    }

    return response.ok;
  } catch {
    return false;
  }
}

export function scheduleMemberSync(user: User): void {
  if (typeof window === "undefined") {
    return;
  }

  const pending = syncTimers.get(user.id);
  if (pending) {
    clearTimeout(pending);
  }

  syncTimers.set(
    user.id,
    setTimeout(() => {
      syncTimers.delete(user.id);
      void syncMemberToServer(user);
    }, SYNC_DEBOUNCE_MS)
  );
}

/** Pull all members from server and merge into local storage for operator tools. */
export async function fetchAndMergeMembersFromServer(): Promise<number> {
  try {
    const response = await fetch("/api/members", {
      cache: "no-store",
      headers: { Pragma: "no-cache" },
    });
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
