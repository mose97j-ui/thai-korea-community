"use client";

import { isOperatorUser } from "@/lib/auth/operator";
import type { User } from "@/lib/auth/types";
import { upsertMemberRegistryProfile } from "@/lib/supabase/memberRegistry";
import { tryCreateClient } from "@/utils/supabase/client";

/** Fallback: signed-in Google member writes their own registry row (RLS). */
export async function syncMemberRegistryViaClient(user: User): Promise<boolean> {
  if (isOperatorUser(user)) {
    return false;
  }

  const supabase = tryCreateClient();
  if (!supabase) {
    return false;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const sessionEmail = session?.user?.email?.trim().toLowerCase();
  const userGmail = user.gmail?.trim().toLowerCase();

  if (!sessionEmail || !userGmail || sessionEmail !== userGmail) {
    return false;
  }

  try {
    const result = await upsertMemberRegistryProfile(supabase, user);
    return result.ok;
  } catch {
    return false;
  }
}
