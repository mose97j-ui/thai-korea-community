"use client";

import { useEffect, useRef } from "react";

type UseIdleEffectOptions = {
  enabled?: boolean;
  idleMs?: number;
};

/** Runs `effect` after `idleMs` with no change to `resetDeps`. */
export function useIdleEffect(
  effect: () => void,
  resetDeps: React.DependencyList,
  options?: UseIdleEffectOptions
): void {
  const { enabled = true, idleMs = 60_000 } = options ?? {};
  const effectRef = useRef(effect);
  effectRef.current = effect;

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const timeout = window.setTimeout(() => {
      effectRef.current();
    }, idleMs);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...resetDeps, enabled, idleMs]);
}
