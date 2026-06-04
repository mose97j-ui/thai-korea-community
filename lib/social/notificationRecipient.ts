import { findOperatorAccount } from "@/lib/auth/operator";
import { hasOperatorPrivileges } from "@/lib/auth/operatorView";
import type { User } from "@/lib/auth/types";

/** Notification rows may target legacy `tkc-operator` or the logged-in operator id. */
export function resolveNotificationUserId(user: User): string {
  if (hasOperatorPrivileges(user)) {
    return findOperatorAccount()?.id ?? user.id;
  }
  return user.id;
}
