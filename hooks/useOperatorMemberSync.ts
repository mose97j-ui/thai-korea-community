"use client";

import { useEffect } from "react";
import { subscribeMemberRegistryChanges } from "@/lib/auth/memberRealtime";
import {
  MEMBERS_SYNC_EVENT,
  fetchAndMergeMembersFromServer,
} from "@/lib/auth/memberSync";

const POLL_MS = 5_000;

/** Operator dashboards — realtime + fast polling for member directory. */
export function useOperatorMemberSync(enabled: boolean) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const refresh = () => {
      void fetchAndMergeMembersFromServer();
    };

    refresh();

    const unsubscribeRealtime = subscribeMemberRegistryChanges(refresh);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };

    window.addEventListener("focus", refresh);
    window.addEventListener("visibilitychange", onVisible);
    window.addEventListener(MEMBERS_SYNC_EVENT, refresh);

    const interval = window.setInterval(refresh, POLL_MS);

    return () => {
      unsubscribeRealtime();
      window.removeEventListener("focus", refresh);
      window.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(MEMBERS_SYNC_EVENT, refresh);
      window.clearInterval(interval);
    };
  }, [enabled]);
}
