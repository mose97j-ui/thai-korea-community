"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { hasOperatorPrivileges } from "@/lib/auth/operatorView";
import { OPERATOR_VIEW_CHANGE_EVENT } from "@/lib/auth/operatorView";
import {
  getUnreadSupportCountForOperator,
  getUnreadSupportCountForUser,
} from "@/lib/support/storage";
import { SUPPORT_CHANGE_EVENT } from "@/lib/support/types";
import { SUPPORT_SYNC_EVENT } from "@/lib/support/supportSync";

export function useSupportBadges() {
  const { user } = useAuth();
  const [unreadSupport, setUnreadSupport] = useState(0);

  const refresh = useCallback(() => {
    if (!user) {
      setUnreadSupport(0);
      return;
    }
    setUnreadSupport(
      hasOperatorPrivileges(user)
        ? getUnreadSupportCountForOperator()
        : getUnreadSupportCountForUser(user.id)
    );
  }, [user]);

  useEffect(() => {
    refresh();
    window.addEventListener(SUPPORT_CHANGE_EVENT, refresh);
    window.addEventListener(SUPPORT_SYNC_EVENT, refresh);
    window.addEventListener(OPERATOR_VIEW_CHANGE_EVENT, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(SUPPORT_CHANGE_EVENT, refresh);
      window.removeEventListener(SUPPORT_SYNC_EVENT, refresh);
      window.removeEventListener(OPERATOR_VIEW_CHANGE_EVENT, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  return { unreadSupport, refresh };
}
