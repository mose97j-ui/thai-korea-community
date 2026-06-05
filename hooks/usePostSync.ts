"use client";

import { useEffect } from "react";
import type { User } from "@/lib/auth/types";
import { isOperatorUser } from "@/lib/auth/operator";
import { subscribePostChanges } from "@/lib/posts/postRealtime";
import { POSTS_SYNC_EVENT, pullPostsForUser } from "@/lib/posts/postSync";

const POLL_MS = 7_000;
const POLL_MS_OPERATOR = 5_000;

/** Pull posts from Supabase so cross-device writes appear in real-time. */
export function usePostSync(enabled: boolean, user: User | null) {
  useEffect(() => {
    if (!enabled || !user?.id) {
      return;
    }

    const refresh = () => {
      void pullPostsForUser(user);
    };

    refresh();
    const unsubscribeRealtime = subscribePostChanges(refresh);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };

    window.addEventListener("focus", refresh);
    window.addEventListener("visibilitychange", onVisible);
    window.addEventListener(POSTS_SYNC_EVENT, refresh);

    const pollMs = user && isOperatorUser(user) ? POLL_MS_OPERATOR : POLL_MS;
    const interval = window.setInterval(refresh, pollMs);

    return () => {
      unsubscribeRealtime();
      window.removeEventListener("focus", refresh);
      window.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(POSTS_SYNC_EVENT, refresh);
      window.clearInterval(interval);
    };
  }, [enabled, user, user?.id]);
}
