import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import { isProfileComplete } from "@/lib/auth/profileComplete";
import {
  findUserByGmail,
  findUserById,
  generatePersonalCode,
  findUserByPersonalCode,
  saveUser,
  setSessionUserId,
  updateUser,
} from "@/lib/auth/storage";
import { isOperatorUser } from "@/lib/auth/operator";
import type { User } from "@/lib/auth/types";
import { scheduleMemberSync } from "@/lib/auth/memberSync";
import { fetchProfileById, profileRowToUser, upsertProfile } from "@/lib/supabase/profiles";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/client";

function createUniqueCode(): string {
  let code = generatePersonalCode();
  while (findUserByPersonalCode(code)) {
    code = generatePersonalCode();
  }
  return code;
}

function buildUserFromAuth(
  authUser: SupabaseAuthUser,
  profile?: User | null
): User {
  const gmail = (authUser.email ?? profile?.gmail ?? "").toLowerCase();
  const existing = findUserByGmail(gmail) ?? (profile ? findUserById(profile.id) : undefined);

  if (profile) {
    const merged: User = {
      ...profile,
      gmail,
      supabaseId: authUser.id,
      authProvider: "google",
    };
    if (existing && existing.id !== merged.id) {
      merged.personalCode = existing.personalCode;
      merged.referredBy = existing.referredBy ?? merged.referredBy;
      merged.premiumUntil = existing.premiumUntil ?? merged.premiumUntil;
      merged.restriction = existing.restriction ?? merged.restriction;
      merged.role = existing.role ?? merged.role;
    }
    return merged;
  }

  if (existing) {
    return {
      ...existing,
      gmail,
      supabaseId: authUser.id,
      authProvider: "google",
    };
  }

  const name =
    (authUser.user_metadata?.full_name as string | undefined)?.trim() ||
    (authUser.user_metadata?.name as string | undefined)?.trim() ||
    gmail.split("@")[0] ||
    "Member";

  return {
    id: authUser.id,
    name,
    nickname: name,
    profileImage:
      (authUser.user_metadata?.avatar_url as string | undefined)?.trim() ||
      (authUser.user_metadata?.picture as string | undefined)?.trim() ||
      undefined,
    birthDate: "",
    hometown: "",
    gmail,
    koreanPhone: "",
    personalCode: createUniqueCode(),
    password: "",
    role: isOperatorUser({ gmail } as User) ? "operator" : "user",
    supabaseId: authUser.id,
    authProvider: "google",
    createdAt: authUser.created_at ?? new Date().toISOString(),
  };
}

function persistLocalUser(user: User): User {
  const existing = findUserById(user.id) ?? findUserByGmail(user.gmail);
  if (existing) {
    const updated: User = {
      ...existing,
      ...user,
      id: user.id,
      personalCode: existing.personalCode || user.personalCode,
      createdAt: existing.createdAt || user.createdAt,
    };
    updateUser(updated);
    return updated;
  }

  saveUser(user);
  return user;
}

export async function syncSupabaseAuthUser(authUser: SupabaseAuthUser): Promise<{
  user: User | null;
  profileComplete: boolean;
}> {
  if (!isSupabaseConfigured()) {
    return { user: null, profileComplete: false };
  }

  const supabase = createClient();
  const profileRow = await fetchProfileById(supabase, authUser.id);
  const profileUser = profileRow ? profileRowToUser(profileRow) : null;
  const user = persistLocalUser(buildUserFromAuth(authUser, profileUser));
  setSessionUserId(user.id);
  if (isProfileComplete(user)) {
    scheduleMemberSync(user, true);
  }
  return {
    user,
    profileComplete: isProfileComplete(user),
  };
}

export async function refreshSupabaseSession(): Promise<{
  user: User | null;
  profileComplete: boolean;
}> {
  if (!isSupabaseConfigured()) {
    return { user: null, profileComplete: false };
  }

  try {
    const supabase = createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      return syncSupabaseAuthUser(session.user);
    }

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return { user: null, profileComplete: false };
    }

    return syncSupabaseAuthUser(authUser);
  } catch {
    return { user: null, profileComplete: false };
  }
}

export async function saveGoogleProfile(user: User): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Supabase is not configured." };
  }

  const supabase = createClient();
  const saved = persistLocalUser(user);
  setSessionUserId(saved.id);
  const result = await upsertProfile(supabase, saved);
  if (!result.ok) {
    return result;
  }
  scheduleMemberSync(saved, true);
  return { ok: true };
}

export function getGoogleRedirectUrl(nextPath = "/"): string {
  if (typeof window === "undefined") {
    return "/auth/callback";
  }

  const next = nextPath.startsWith("/") ? nextPath : "/";
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
}
