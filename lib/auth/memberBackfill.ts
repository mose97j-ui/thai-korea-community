import { isOperatorUser } from "@/lib/auth/operator";
import { getAllUsers } from "@/lib/auth/storage";
import type { User } from "@/lib/auth/types";
import {
  buildMemberSyncPayload,
  dispatchMembersSyncEvent,
  syncMemberToServer,
} from "@/lib/auth/memberSync";

export type MemberBackfillResult = {
  total: number;
  synced: number;
  skipped: number;
};

/** Whether this account can be stored in the shared member directory. */
export function isMemberSyncable(member: User): boolean {
  if (isOperatorUser(member)) {
    return false;
  }

  const gmail = member.gmail?.trim().toLowerCase() ?? "";
  const nickname = member.nickname?.trim() ?? "";
  const name = member.name?.trim() ?? "";
  const personalCode = member.personalCode?.trim() ?? "";

  return (
    gmail.endsWith("@gmail.com") &&
    nickname.length >= 2 &&
    name.length >= 1 &&
    personalCode.length >= 2
  );
}

export function listLocalMembersForBackfill(): User[] {
  return getAllUsers().filter(isMemberSyncable);
}

/** Upload every sign-up stored in this browser (pre-update signups included). */
export async function backfillAllLocalMembersInBrowser(): Promise<MemberBackfillResult> {
  const locals = listLocalMembersForBackfill();
  if (locals.length === 0) {
    return { total: 0, synced: 0, skipped: 0 };
  }

  try {
    const response = await fetch("/api/members/backfill", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        members: locals.map((member) => buildMemberSyncPayload(member)),
      }),
      cache: "no-store",
    });

    if (response.ok) {
      const payload = (await response.json()) as {
        synced?: number;
        total?: number;
      };
      const synced = payload.synced ?? 0;
      if (synced > 0) {
        dispatchMembersSyncEvent();
      }
      return {
        total: payload.total ?? locals.length,
        synced,
        skipped: (payload.total ?? locals.length) - synced,
      };
    }
  } catch {
    // Fall through to per-member sync.
  }

  let synced = 0;
  for (const member of locals) {
    if (await syncMemberToServer(member)) {
      synced += 1;
    }
  }

  if (synced > 0) {
    dispatchMembersSyncEvent();
  }

  return {
    total: locals.length,
    synced,
    skipped: locals.length - synced,
  };
}
