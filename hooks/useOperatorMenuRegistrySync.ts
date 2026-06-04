"use client";

import { useEffect } from "react";
import { subscribeOperatorMenuChanges } from "@/lib/categories/operatorMenuRealtime";
import { fetchAndMergeOperatorMenusFromServer } from "@/lib/categories/operatorMenuSync";

const POLL_MS = 8_000;

/** All app pages — pull operator menu config and listen for realtime updates. */
export function useOperatorMenuRegistrySync(enabled: boolean) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const refresh = () => {
      void fetchAndMergeOperatorMenusFromServer();
    };

    refresh();

    const unsubscribeRealtime = subscribeOperatorMenuChanges(refresh);

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
