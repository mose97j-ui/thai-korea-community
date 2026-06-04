"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "tkc-mobile-nav-dock-expanded";

function readStored(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeStored(expanded: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, expanded ? "1" : "0");
  } catch {
    // ignore
  }
}

function applyDockDataset(expanded: boolean): void {
  if (typeof document === "undefined") {
    return;
  }
  document.documentElement.dataset.mobileDock = expanded ? "expanded" : "collapsed";
}

/** Mobile bottom dock — collapsed by default so feed content stays visible. */
export function useMobileNavDock() {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const stored = readStored();
    setExpanded(stored);
    applyDockDataset(stored);
  }, []);

  const toggle = useCallback(() => {
    setExpanded((current) => {
      const next = !current;
      writeStored(next);
      applyDockDataset(next);
      return next;
    });
  }, []);

  const collapse = useCallback(() => {
    setExpanded(false);
    writeStored(false);
    applyDockDataset(false);
  }, []);

  return { expanded, toggle, collapse };
}
