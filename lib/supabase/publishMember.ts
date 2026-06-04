import type { User } from "@/lib/auth/types";
import { createAdminClient, isSupabaseAdminConfigured } from "@/utils/supabase/admin";
import { upsertMemberRegistry } from "@/lib/supabase/memberRegistry";
import { upsertProfile } from "@/lib/supabase/profiles";

type PublishOptions = {
  /** When true (default), Google/Supabase users also update `profiles`. */
  mirrorProfile?: boolean;
};

/** Push member directory to Supabase (shared source for operator realtime). */
export async function publishMemberToDirectory(
  user: User,
  options: PublishOptions = {}
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, message: "Supabase admin is not configured." };
  }

  const mirrorProfile = options.mirrorProfile !== false;
  const shouldMirrorProfile =
    mirrorProfile && (user.authProvider === "google" || Boolean(user.supabaseId));

  try {
    const supabase = createAdminClient();
    const registry = await upsertMemberRegistry(supabase, user);
    if (!registry.ok) {
      return registry;
    }

    if (shouldMirrorProfile) {
      const profile = await upsertProfile(supabase, user);
      if (!profile.ok) {
        return profile;
      }
    }

    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Publish failed.";
    return { ok: false, message };
  }
}
