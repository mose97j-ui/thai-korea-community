import type { User } from "@/lib/auth/types";

function restrictionEqual(
  a: User["restriction"],
  b: User["restriction"]
): boolean {
  if (a === b) {
    return true;
  }
  if (!a || !b) {
    return !a && !b;
  }
  return (
    a.scope === b.scope &&
    a.reason === b.reason &&
    a.until === b.until &&
    a.createdAt === b.createdAt &&
    a.createdBy === b.createdBy &&
    a.source === b.source
  );
}

/** True when auth context does not need a new React state object. */
export function isSameSessionUser(
  previous: User | null | undefined,
  next: User | null | undefined
): boolean {
  if (previous === next) {
    return true;
  }
  if (!previous || !next) {
    return !previous && !next;
  }

  return (
    previous.id === next.id &&
    previous.name === next.name &&
    previous.nickname === next.nickname &&
    previous.gender === next.gender &&
    previous.profileImage === next.profileImage &&
    previous.birthDate === next.birthDate &&
    previous.hometown === next.hometown &&
    previous.gmail === next.gmail &&
    previous.koreanPhone === next.koreanPhone &&
    previous.personalCode === next.personalCode &&
    previous.referredBy === next.referredBy &&
    previous.role === next.role &&
    previous.premiumUntil === next.premiumUntil &&
    previous.authProvider === next.authProvider &&
    previous.createdAt === next.createdAt &&
    restrictionEqual(previous.restriction, next.restriction)
  );
}
