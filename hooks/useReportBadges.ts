"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { hasOperatorPrivileges } from "@/lib/auth/operatorView";
import { OPERATOR_VIEW_CHANGE_EVENT } from "@/lib/auth/operatorView";
import { getPendingReportCount, REPORT_CHANGE_EVENT } from "@/lib/moderation/reports";

export function useReportBadges() {
  const { user } = useAuth();
  const [pendingReports, setPendingReports] = useState(0);

  const refresh = useCallback(() => {
    if (!user || !hasOperatorPrivileges(user)) {
      setPendingReports(0);
      return;
    }
    setPendingReports(getPendingReportCount());
  }, [user]);

  useEffect(() => {
    refresh();
    window.addEventListener(REPORT_CHANGE_EVENT, refresh);
    window.addEventListener(OPERATOR_VIEW_CHANGE_EVENT, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(REPORT_CHANGE_EVENT, refresh);
      window.removeEventListener(OPERATOR_VIEW_CHANGE_EVENT, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  return { pendingReports, refresh };
}
