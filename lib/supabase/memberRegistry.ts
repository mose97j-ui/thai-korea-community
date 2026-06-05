import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@/lib/auth/types";

export type MemberRegistryRow = {
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
  role: "user" | "operator";
  premium_until: string | null;
  points: number | null;
  restriction: User["restriction"] | null;
  auth_provider: "local" | "google";
  created_at: string;
  updated_at: string;
};

export function memberRowToUser(row: MemberRegistryRow): User {
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
    premiumUntil: row.premium_until ?? undefined,
    points: typeof row.points === "number" ? row.points : 0,
    restriction: row.restriction ?? undefined,
    authProvider: row.auth_provider,
    createdAt: row.created_at,
  };
}

export function userToMemberRow(user: User): Omit<MemberRegistryRow, "updated_at"> {
  return {
    id: user.id,
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
    premium_until: user.premiumUntil ?? null,
    points: Number.isFinite(user.points) ? Math.max(0, Math.floor(user.points ?? 0)) : 0,
    restriction: user.restriction ?? null,
    auth_provider: user.authProvider ?? "local",
    created_at: user.createdAt,
  };
}

export async function listMemberRegistry(
  supabase: SupabaseClient
): Promise<MemberRegistryRow[]> {
  const { data, error } = await supabase
    .from("member_registry")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as MemberRegistryRow[];
}

export async function upsertMemberRegistry(
  supabase: SupabaseClient,
  user: User
): Promise<{ ok: true } | { ok: false; message: string }> {
  const row = {
    ...userToMemberRow(user),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("member_registry").upsert(row, {
    onConflict: "id",
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
}

/** Member self-update — keeps premium / restriction / role from existing row. */
export async function upsertMemberRegistryProfile(
  supabase: SupabaseClient,
  user: User
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { data: existing } = await supabase
    .from("member_registry")
    .select("role, premium_until, points, restriction")
    .eq("id", user.id)
    .maybeSingle();

  const merged: User = {
    ...user,
    role:
      existing?.role === "operator" || user.role === "operator" ? "operator" : "user",
    premiumUntil:
      existing?.premium_until != null
        ? String(existing.premium_until)
        : user.premiumUntil,
    points:
      typeof existing?.points === "number"
        ? existing.points
        : (user.points ?? 0),
    restriction:
      (existing?.restriction as User["restriction"] | null) ?? user.restriction,
  };

  return upsertMemberRegistry(supabase, merged);
}
