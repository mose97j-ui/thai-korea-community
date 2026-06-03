"use client";

import { useEffect } from "react";
import {
  fetchAndMergeMembersFromServer,
} from "@/lib/auth/memberSync";

/** Operator dashboards — pull shared member directory from Supabase. */
export function useOperatorMemberSync(enabled: boolean) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const refresh = () => {
      void fetchAndMergeMembersFromServer();
    };

    refresh();
    window.addEventListener("focus", refresh);
    const interval = window.setInterval(refresh, 30_000);

    return () => {
      window.removeEventListener("focus", refresh);
      window.clearInterval(interval);
    };
  }, [enabled]);
}
