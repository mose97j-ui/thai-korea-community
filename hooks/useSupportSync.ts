"use client";

import { useEffect } from "react";
import type { User } from "@/lib/auth/types";
import { isOperatorUser } from "@/lib/auth/operator";
import { subscribeSupportRequestChanges } from "@/lib/support/supportRealtime";
import { pullSupportRequestsForUser, SUPPORT_SYNC_EVENT } from "@/lib/support/supportSync";
import { SUPPORT_CHANGE_EVENT } from "@/lib/support/types";

const POLL_MS = 5_000;
const POLL_MS_OPERATOR = 3_000;

/** Pull support requests from Supabase (member ↔ operator across devices). */
export function useSupportSync(enabled: boolean, user: User | null) {
  useEffect(() => {
    if (!enabled || !user?.gmail) {
      return;
    }

    const refresh = () => {
      void pullSupportRequestsForUser(user);
    };

    refresh();

    const unsubscribeRealtime = subscribeSupportRequestChanges(refresh);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };

    window.addEventListener("focus", refresh);
    window.addEventListener("visibilitychange", onVisible);
    window.addEventListener(SUPPORT_SYNC_EVENT, refresh);
    window.addEventListener(SUPPORT_CHANGE_EVENT, refresh);

    const pollMs = user && isOperatorUser(user) ? POLL_MS_OPERATOR : POLL_MS;
    const interval = window.setInterval(refresh, pollMs);

    return () => {
      unsubscribeRealtime();
      window.removeEventListener("focus", refresh);
      window.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(SUPPORT_SYNC_EVENT, refresh);
      window.removeEventListener(SUPPORT_CHANGE_EVENT, refresh);
      window.clearInterval(interval);
    };
  }, [enabled, user, user?.id, user?.gmail]);
}
