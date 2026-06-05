import { isOperatorUser } from "./operator";
import { hasOperatorPrivileges } from "./operatorView";
import {
  findUserByGmail,
  findUserById,
  findUserByNickname,
  findUserByPersonalCode,
  getAllUsers,
  updateUser,
} from "./storage";
import type { User, UserRestriction } from "./types";

export type RestrictionScope = UserRestriction["scope"];

export type ApplyRestrictionInput = {
  scope: RestrictionScope;
  reason?: string;
  durationDays?: number | null;
  source?: UserRestriction["source"];
};

export const MODERATION_CHANGE_EVENT = "tkc-moderation-change";

function notifyModerationChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(MODERATION_CHANGE_EVENT));
  }
}

function isExpired(restriction: UserRestriction): boolean {
  if (!restriction.until) {
    return false;
  }
  return new Date(restriction.until).getTime() <= Date.now();
}

export function getActiveRestriction(
  user: User | null | undefined
): UserRestriction | null {
  if (hasOperatorPrivileges(user)) {
    return null;
  }
  if (!user?.restriction) {
    return null;
  }
  // Temporarily suppress legacy auto restrictions to avoid false positives.
  if (user.restriction.source === "auto") {
    return null;
  }
  if (isExpired(user.restriction)) {
    return null;
  }
  return user.restriction;
}

export function isLoginBlocked(user: User | null | undefined): boolean {
  if (hasOperatorPrivileges(user)) {
    return false;
  }
  const restriction = getActiveRestriction(user);
  return restriction?.scope === "permanent";
}

export function canWritePosts(user: User | null | undefined): boolean {
  if (hasOperatorPrivileges(user)) {
    return true;
  }
  const restriction = getActiveRestriction(user);
  if (!restriction) {
    return true;
  }
  if (
    restriction.scope === "permanent" ||
    restriction.scope === "activity" ||
    restriction.scope === "write"
  ) {
    return false;
  }
  return true;
}

export function canComment(user: User | null | undefined): boolean {
  if (hasOperatorPrivileges(user)) {
    return true;
  }
  const restriction = getActiveRestriction(user);
  if (!restriction) {
    return true;
  }
  if (
    restriction.scope === "permanent" ||
    restriction.scope === "activity" ||
    restriction.scope === "comment"
  ) {
    return false;
  }
  return true;
}

export function canSendMessage(user: User | null | undefined): boolean {
  if (hasOperatorPrivileges(user)) {
    return true;
  }
  const restriction = getActiveRestriction(user);
  if (!restriction) {
    return true;
  }
  if (
    restriction.scope === "permanent" ||
    restriction.scope === "activity" ||
    restriction.scope === "message"
  ) {
    return false;
  }
  return true;
}

function buildUntil(durationDays?: number | null): string | undefined {
  if (durationDays === null || durationDays === undefined) {
    return undefined;
  }
  const until = new Date();
  until.setDate(until.getDate() + durationDays);
  return until.toISOString();
}

export function searchUsersForModeration(query: string): User[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return [];
  }

  return getAllUsers()
    .filter((user) => !isOperatorUser(user))
    .filter((user) => {
      return (
        user.gmail.toLowerCase().includes(trimmed) ||
        user.nickname.toLowerCase().includes(trimmed) ||
        user.name.toLowerCase().includes(trimmed) ||
        user.personalCode.toLowerCase().includes(trimmed) ||
        user.koreanPhone.includes(trimmed)
      );
    })
    .slice(0, 12);
}

export function listRestrictedUsers(): User[] {
  return getAllUsers()
    .filter((user) => !isOperatorUser(user) && getActiveRestriction(user))
    .sort((a, b) => {
      const aTime = getActiveRestriction(a)?.createdAt ?? "";
      const bTime = getActiveRestriction(b)?.createdAt ?? "";
      return bTime.localeCompare(aTime);
    });
}

export function applyUserRestriction(
  targetUserId: string,
  operator: User,
  input: ApplyRestrictionInput
): { ok: true; user: User } | { ok: false; error: "NOT_FOUND" | "OPERATOR_TARGET" } {
  if (!isOperatorUser(operator)) {
    return { ok: false, error: "NOT_FOUND" };
  }

  const target = findUserById(targetUserId);
  if (!target) {
    return { ok: false, error: "NOT_FOUND" };
  }
  if (isOperatorUser(target)) {
    return { ok: false, error: "OPERATOR_TARGET" };
  }

  const restriction: UserRestriction = {
    scope: input.scope,
    reason: input.reason?.trim() || undefined,
    until:
      input.scope === "permanent" ? undefined : buildUntil(input.durationDays),
    createdAt: new Date().toISOString(),
    createdBy: operator.id,
    source: input.source ?? "manual",
  };

  const updated: User = { ...target, restriction };
  updateUser(updated);
  notifyModerationChange();
  return { ok: true, user: updated };
}

export function clearUserRestriction(
  targetUserId: string,
  operator: User
): { ok: true; user: User } | { ok: false; error: "NOT_FOUND" | "OPERATOR_TARGET" } {
  if (!isOperatorUser(operator)) {
    return { ok: false, error: "NOT_FOUND" };
  }

  const target = findUserById(targetUserId);
  if (!target) {
    return { ok: false, error: "NOT_FOUND" };
  }
  if (isOperatorUser(target)) {
    return { ok: false, error: "OPERATOR_TARGET" };
  }

  const updated: User = { ...target, restriction: undefined };
  updateUser(updated);
  notifyModerationChange();
  return { ok: true, user: updated };
}

export function purgeExpiredRestrictions(): void {
  const users = getAllUsers();
  let changed = false;

  for (const user of users) {
    if (user.restriction && isExpired(user.restriction)) {
      updateUser({ ...user, restriction: undefined });
      changed = true;
    }
  }

  if (changed) {
    notifyModerationChange();
  }
}

export function findUserForModeration(query: string): User | undefined {
  const trimmed = query.trim();
  if (!trimmed) {
    return undefined;
  }

  const byCode = findUserByPersonalCode(trimmed);
  if (byCode && !isOperatorUser(byCode)) {
    return byCode;
  }

  const byGmail = findUserByGmail(trimmed);
  if (byGmail && !isOperatorUser(byGmail)) {
    return byGmail;
  }

  const byNickname = findUserByNickname(trimmed);
  if (byNickname && !isOperatorUser(byNickname)) {
    return byNickname;
  }

  return searchUsersForModeration(trimmed)[0];
}
