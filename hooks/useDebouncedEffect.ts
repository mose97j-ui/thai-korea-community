"use client";

import { useEffect, useRef } from "react";

export function useDebouncedEffect(
  effect: () => void,
  deps: React.DependencyList,
  delayMs = 600
): void {
  const effectRef = useRef(effect);
  effectRef.current = effect;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      effectRef.current();
    }, delayMs);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
