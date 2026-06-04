"use client";

import type { User } from "@/lib/auth/types";
import { memberRowToUser, type MemberRegistryRow } from "@/lib/supabase/memberRegistry";
import { profileRowToUser, type SupabaseProfileRow } from "@/lib/supabase/profiles";
import { isSupabaseConfigured, tryCreateClient } from "@/utils/supabase/client";

export function isMemberDirectoryClientConfigured(): boolean {
  return isSupabaseConfigured();
}

function mergeDirectoryMembers(registry: User[], profiles: User[]): User[] {
  const byGmail = new Map<string, User>();

  for (const member of [...registry, ...profiles]) {
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

  return [...byGmail.values()].sort((a, b) =>
    (b.createdAt || "").localeCompare(a.createdAt || "")
  );
}

/** Read shared member directory via anon key (RLS select is public). */
export async function fetchMemberDirectoryFromSupabase(): Promise<User[]> {
  const supabase = tryCreateClient();
  if (!supabase) {
    return [];
  }

  const [registryResult, profileResult] = await Promise.all([
    supabase
      .from("member_registry")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
  ]);

  const registry = (registryResult.data ?? []) as MemberRegistryRow[];
  const profiles = (profileResult.data ?? []) as SupabaseProfileRow[];

  return mergeDirectoryMembers(
    registry.map(memberRowToUser),
    profiles.map(profileRowToUser)
  );
}
