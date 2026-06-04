"use client";

import { useCallback, useEffect, useState } from "react";
import {
  OPERATOR_MENUS_CHANGE_EVENT,
  isOperatorMenuEditSessionActive,
  persistOperatorMenuEditSession,
} from "@/lib/categories/operatorMenus";
import { IDLE_AUTOSAVE_MS } from "@/lib/ui/idleAutosave";
import { useIdleEffect } from "@/hooks/useIdleEffect";

/** After 1 minute without menu edits, persist the operator edit session and sync. */
export function useOperatorMenuIdleAutoSave(
  enabled: boolean,
  onPersisted: () => void,
  menuSignature: string
): void {
  const [activityBump, setActivityBump] = useState(0);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const bump = () => setActivityBump((n) => n + 1);
    window.addEventListener(OPERATOR_MENUS_CHANGE_EVENT, bump);
    return () => window.removeEventListener(OPERATOR_MENUS_CHANGE_EVENT, bump);
  }, [enabled]);

  const persist = useCallback(() => {
    if (!isOperatorMenuEditSessionActive()) {
      return;
    }
    if (persistOperatorMenuEditSession()) {
      onPersisted();
    }
  }, [onPersisted]);

  useIdleEffect(persist, [activityBump, menuSignature], {
    enabled,
    idleMs: IDLE_AUTOSAVE_MS,
  });
}
