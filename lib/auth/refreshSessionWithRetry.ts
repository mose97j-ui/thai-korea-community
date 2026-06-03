import type { User } from "./types";
import { refreshSupabaseSession } from "./supabaseUser";

const RETRY_DELAYS_MS = [0, 200, 400, 600, 800, 1000, 1200, 1500];

export async function refreshSupabaseSessionWithRetry(): Promise<{
  user: User | null;
  profileComplete: boolean;
}> {
  let lastResult = { user: null as User | null, profileComplete: false };

  for (const delay of RETRY_DELAYS_MS) {
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    lastResult = await refreshSupabaseSession();
    if (lastResult.user) {
      return lastResult;
    }
  }

  return lastResult;
}
