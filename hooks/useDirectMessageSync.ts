"use client";

import { useEffect } from "react";
import type { User } from "@/lib/auth/types";
import { isOperatorUser } from "@/lib/auth/operator";
import { pullMessagesForUser } from "@/lib/social/messageSync";
import { MESSAGES_SYNC_EVENT } from "@/lib/social/messageSync";
import { subscribeDirectMessageChanges } from "@/lib/social/messageRealtime";

const POLL_MS = 5_000;
const POLL_MS_OPERATOR = 3_000;

/** Pull direct messages from Supabase for the logged-in user (all devices). */
export function useDirectMessageSync(enabled: boolean, user: User | null) {
  useEffect(() => {
    if (!enabled || !user?.gmail) {
      return;
    }

    const refresh = () => {
      void pullMessagesForUser(user);
    };

    refresh();

    const unsubscribeRealtime = subscribeDirectMessageChanges(refresh);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };

    window.addEventListener("focus", refresh);
    window.addEventListener("visibilitychange", onVisible);
    window.addEventListener(MESSAGES_SYNC_EVENT, refresh);

    const pollMs = user && isOperatorUser(user) ? POLL_MS_OPERATOR : POLL_MS;
    const interval = window.setInterval(refresh, pollMs);

    return () => {
      unsubscribeRealtime();
      window.removeEventListener("focus", refresh);
      window.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(MESSAGES_SYNC_EVENT, refresh);
      window.clearInterval(interval);
    };
  }, [enabled, user, user?.id, user?.gmail]);
}
