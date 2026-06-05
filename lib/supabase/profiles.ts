import type { SupabaseClient } from "@supabase/supabase-js";
import type { User, UserRestriction, UserRole } from "@/lib/auth/types";

export type SupabaseProfileRow = {
  id: string;
  name: string;
  nickname: string;
  gender: "male" | "female" | null;
  profile_image: string | null;
  birth_date: string;
  hometown: string;
  gmail: string;
  korean_phone: string;
  personal_code: string;
  referred_by: string | null;
  role: UserRole;
  preferred_locale: "ko" | "th" | null;
  is_korean_member: boolean | null;
  premium_until: string | null;
  restriction: UserRestriction | null;
  created_at: string;
};

export function profileRowToUser(row: SupabaseProfileRow): User {
  return {
    id: row.id,
    name: row.name,
    nickname: row.nickname,
    gender: row.gender ?? undefined,
    profileImage: row.profile_image ?? undefined,
    birthDate: row.birth_date,
    hometown: row.hometown,
    gmail: row.gmail.toLowerCase(),
    koreanPhone: row.korean_phone,
    personalCode: row.personal_code,
    referredBy: row.referred_by ?? undefined,
    password: "",
    role: row.role,
    preferredLocale: row.preferred_locale ?? undefined,
    isKoreanMember: row.is_korean_member ?? undefined,
    premiumUntil: row.premium_until ?? undefined,
    restriction: row.restriction ?? undefined,
    supabaseId: row.id,
    authProvider: "google",
    createdAt: row.created_at,
  };
}

export function userToProfileRow(user: User): SupabaseProfileRow {
  return {
    id: user.supabaseId ?? user.id,
    name: user.name,
    nickname: user.nickname,
    gender: user.gender ?? null,
    profile_image: user.profileImage ?? null,
    birth_date: user.birthDate,
    hometown: user.hometown,
    gmail: user.gmail.toLowerCase(),
    korean_phone: user.koreanPhone,
    personal_code: user.personalCode,
    referred_by: user.referredBy ?? null,
    role: user.role ?? "user",
    preferred_locale: user.preferredLocale ?? null,
    is_korean_member: user.isKoreanMember ?? null,
    premium_until: user.premiumUntil ?? null,
    restriction: user.restriction ?? null,
    created_at: user.createdAt,
  };
}

export async function listAllProfiles(
  supabase: SupabaseClient
): Promise<SupabaseProfileRow[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as SupabaseProfileRow[];
}

export async function fetchProfileById(
  supabase: SupabaseClient,
  userId: string
): Promise<SupabaseProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as SupabaseProfileRow;
}

export async function upsertProfile(
  supabase: SupabaseClient,
  user: User
): Promise<{ ok: true } | { ok: false; message: string }> {
  const row = userToProfileRow(user);
  const { error } = await supabase.from("profiles").upsert(row, { onConflict: "id" });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
}
