"use client";

import { useEffect } from "react";
import { subscribeMemberRegistryChanges } from "@/lib/auth/memberRealtime";
import { fetchAndMergeMembersFromServer } from "@/lib/auth/memberSync";

const POLL_MS = 3_000;

/** Operator dashboards — realtime + fast polling for member directory. */
export function useOperatorMemberSync(enabled: boolean) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const refresh = async () => {
      await fetchAndMergeMembersFromServer();
    };

    void refresh();

    const unsubscribeRealtime = subscribeMemberRegistryChanges(refresh);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };

    window.addEventListener("focus", refresh);
    window.addEventListener("visibilitychange", onVisible);

    const interval = window.setInterval(refresh, POLL_MS);

    return () => {
      unsubscribeRealtime();
      window.removeEventListener("focus", refresh);
      window.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(interval);
    };
  }, [enabled]);
}
