import { getSessionUser } from "@/lib/auth/storage";
import type { User } from "@/lib/auth/types";

/** Email/password accounts — must not be overwritten by a lingering Supabase session. */
export function isLocalAuthUser(user: User | null | undefined): boolean {
  return user?.authProvider === "local";
}

export function getPreferredLocalSessionUser(): User | null {
  const sessionUser = getSessionUser();
  return isLocalAuthUser(sessionUser) ? sessionUser : null;
}

export function shouldIgnoreSupabaseSessionSync(): boolean {
  return getPreferredLocalSessionUser() !== null;
}
