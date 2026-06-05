import { isOperatorUser } from "@/lib/auth/operator";
import { getSessionUser, mergeRemoteMembers } from "@/lib/auth/storage";
import type { User } from "@/lib/auth/types";

export const MEMBERS_SYNC_EVENT = "tkc-members-sync";

const SYNC_DEBOUNCE_MS = 300;
const SYNC_RETRY_MS = 2_500;
const syncTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function dispatchMembersSyncEvent() {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(MEMBERS_SYNC_EVENT));
}

export type MemberSyncPayload = {
  id: string;
  name: string;
  nickname: string;
  gender?: User["gender"];
  profileImage?: string;
  birthDate: string;
  hometown: string;
  gmail: string;
  koreanPhone: string;
  personalCode: string;
  referredBy?: string;
  authProvider: "local" | "google";
  createdAt: string;
  role?: User["role"];
  premiumUntil?: string;
  points?: number;
  restriction?: User["restriction"];
  syncAsOperator?: boolean;
  operatorGmail?: string;
};

/** Member record for server directory — never attach operator session flags. */
export function buildMemberSyncPayload(user: User): MemberSyncPayload {
  return {
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
}

/** Operator session pushing moderation fields for a specific member. */
export function buildOperatorMemberSyncPayload(user: User): MemberSyncPayload | null {
  const session = getSessionUser();
  if (!session || !isOperatorUser(session)) {
    return null;
  }

  return {
    ...buildMemberSyncPayload(user),
    role: user.role,
    premiumUntil: user.premiumUntil,
    points: user.points,
    restriction: user.restriction,
    syncAsOperator: true,
    operatorGmail: session.gmail,
  };
}

const SYNC_MAX_ATTEMPTS = 3;

/** Push a member record to the shared Supabase directory (debounced, no password). */
export async function syncMemberToServer(user: User, attempt = 1): Promise<boolean> {
  try {
    const response = await fetch("/api/members/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildMemberSyncPayload(user)),
      cache: "no-store",
    });

    if (response.ok) {
      dispatchMembersSyncEvent();
      return true;
    }
  } catch {
    // Fall through to client upsert (Google session).
  }

  try {
    const { syncMemberRegistryViaClient } = await import(
      "@/lib/auth/memberRegistryClientSync"
    );
    if (await syncMemberRegistryViaClient(user)) {
      dispatchMembersSyncEvent();
      return true;
    }
  } catch {
    // Retry below.
  }

  if (attempt < SYNC_MAX_ATTEMPTS) {
    await new Promise((resolve) => setTimeout(resolve, SYNC_RETRY_MS));
    return syncMemberToServer(user, attempt + 1);
  }

  return false;
}

export function scheduleMemberSync(user: User, immediate = false): void {
  if (typeof window === "undefined") {
    return;
  }

  const pending = syncTimers.get(user.id);
  if (pending) {
    clearTimeout(pending);
    syncTimers.delete(user.id);
  }

  if (immediate) {
    void syncMemberToServer(user);
    return;
  }

  syncTimers.set(
    user.id,
    setTimeout(() => {
      syncTimers.delete(user.id);
      void syncMemberToServer(user);
    }, SYNC_DEBOUNCE_MS)
  );
}

/** Push every non-operator account in this browser to Supabase (operator session only). */
export async function backfillLocalMembersForOperator(): Promise<number> {
  const session = getSessionUser();
  if (!session || !isOperatorUser(session)) {
    return 0;
  }

  const { backfillAllLocalMembersInBrowser } = await import("@/lib/auth/memberBackfill");
  const result = await backfillAllLocalMembersInBrowser();
  return result.synced;
}

export type MembersDirectoryResponse = {
  members: User[];
  meta: {
    /** Operator can read member_registry (Supabase client and/or API). */
    configured: boolean;
    /** Server can accept POST /api/members/sync (service role on Vercel). */
    syncConfigured: boolean;
    registryCount: number;
    profileCount: number;
  };
};

function mergeDirectoryMembers(a: User[], b: User[]): User[] {
  const byGmail = new Map<string, User>();
  for (const member of [...a, ...b]) {
    const gmail = member.gmail?.trim().toLowerCase();
    if (!gmail) {
      continue;
    }
    const existing = byGmail.get(gmail);
    if (!existing) {
      byGmail.set(gmail, member);
      continue;
    }
    byGmail.set(gmail, {
      ...existing,
      ...member,
      id: existing.id,
      personalCode: existing.personalCode || member.personalCode,
      createdAt: existing.createdAt || member.createdAt,
      password: "",
    });
  }
  return [...byGmail.values()].sort((left, right) =>
    (right.createdAt || "").localeCompare(left.createdAt || "")
  );
}

/** Pull all members from server and merge into local storage for operator tools. */
export async function fetchMembersDirectory(): Promise<MembersDirectoryResponse> {
  const emptyMeta = {
    configured: false,
    syncConfigured: false,
    registryCount: 0,
    profileCount: 0,
  };

  let members: User[] = [];
  let clientReadable = false;

  if (typeof window !== "undefined") {
    try {
      const {
        fetchMemberDirectoryFromSupabase,
        isMemberDirectoryClientConfigured,
      } = await import("@/lib/supabase/memberDirectoryClient");
      if (isMemberDirectoryClientConfigured()) {
        clientReadable = true;
        members = await fetchMemberDirectoryFromSupabase();
      }
    } catch {
      // Fall through to API route.
    }
  }

  let apiConfigured = false;
  let syncConfigured = false;
  let registryCount = 0;
  let profileCount = 0;

  try {
    const response = await fetch("/api/members", {
      cache: "no-store",
      headers: { Pragma: "no-cache" },
    });
    if (response.ok) {
      const payload = (await response.json()) as MembersDirectoryResponse;
      apiConfigured = payload.meta?.configured ?? false;
      syncConfigured = payload.meta?.syncConfigured ?? apiConfigured;
      registryCount = payload.meta?.registryCount ?? 0;
      profileCount = payload.meta?.profileCount ?? 0;
      if (payload.members?.length) {
        members = mergeDirectoryMembers(members, payload.members);
      }
    }
  } catch {
    // Keep client results only.
  }

  const configured = clientReadable || apiConfigured;

  return {
    members,
    meta: {
      configured,
      syncConfigured,
      registryCount: members.length || registryCount,
      profileCount,
    },
  };
}

export async function fetchAndMergeMembersFromServer(): Promise<number> {
  const { members, meta } = await fetchMembersDirectory();
  if (!meta.configured) {
    return 0;
  }

  if (members.length > 0) {
    const changed = mergeRemoteMembers(members);
    if (changed) {
      dispatchMembersSyncEvent();
    }
  } else {
    dispatchMembersSyncEvent();
  }

  return members.length;
}
