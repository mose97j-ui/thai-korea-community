"use client";

import { useEffect } from "react";
import { subscribeMemberRegistryChanges } from "@/lib/auth/memberRealtime";
import { fetchAndMergeMembersFromServer } from "@/lib/auth/memberSync";

const POLL_MS_DEFAULT = 10_000;
const POLL_MS_OPERATOR = 5_000;

type Options = {
  enabled: boolean;
  /** Operator dashboards poll faster for near-real-time member updates. */
  fastPoll?: boolean;
};

/** Logged-in sessions — member/premium/restriction changes from operator sync here. */
export function useMemberRegistrySync({ enabled, fastPoll = false }: Options) {
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

    const pollMs = fastPoll ? POLL_MS_OPERATOR : POLL_MS_DEFAULT;
    const interval = window.setInterval(refresh, pollMs);

    return () => {
      unsubscribeRealtime();
      window.removeEventListener("focus", refresh);
      window.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(interval);
    };
  }, [enabled, fastPoll]);
}
