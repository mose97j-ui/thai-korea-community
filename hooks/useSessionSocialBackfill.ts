"use client";

import { useEffect, useRef } from "react";
import type { User } from "@/lib/auth/types";
import { backfillSocialDataForUser } from "@/lib/social/socialBackfill";

/** On login, merge all past DMs and support requests with Supabase (both directions). */
export function useSessionSocialBackfill(enabled: boolean, user: User | null) {
  const userId = user?.id ?? null;
  const ranForUser = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !userId || !user?.gmail) {
      return;
    }

    if (ranForUser.current === userId) {
      return;
    }
    ranForUser.current = userId;

    void backfillSocialDataForUser(user);
  }, [enabled, user, userId, user?.gmail]);
}
