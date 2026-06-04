"use client";

import { useEffect, useRef } from "react";
import { backfillAllLocalMembersInBrowser } from "@/lib/auth/memberBackfill";
import { scheduleMemberSync } from "@/lib/auth/memberSync";
import type { User } from "@/lib/auth/types";

/** On login, upload every signup saved in this browser (includes pre-update signups). */
export function useSessionMemberBackfill(enabled: boolean, user: User | null) {
  const userId = user?.id ?? null;
  const ranForUser = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !userId || !user) {
      return;
    }

    if (ranForUser.current === userId) {
      return;
    }
    ranForUser.current = userId;

    void (async () => {
      await backfillAllLocalMembersInBrowser();
      scheduleMemberSync(user, true);
    })();
  }, [enabled, user, userId]);
}
