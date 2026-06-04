"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { OPERATOR_MENUS_CHANGE_EVENT } from "@/lib/categories/operatorMenus";
import { USER_MENUS_CHANGE_EVENT } from "@/lib/categories/userMenus";

const CategoryRegistryContext = createContext(0);

/** Bumps when operator or user menu storage changes — use in useMemo deps for registry reads. */
export function useCategoryRegistryVersion(): number {
  return useContext(CategoryRegistryContext);
}

const REGISTRY_BUMP_DEBOUNCE_MS = 120;

export function CategoryRegistryProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const bump = () => {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        timer = null;
        setVersion((value) => value + 1);
      }, REGISTRY_BUMP_DEBOUNCE_MS);
    };

    window.addEventListener(OPERATOR_MENUS_CHANGE_EVENT, bump);
    window.addEventListener(USER_MENUS_CHANGE_EVENT, bump);
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
      window.removeEventListener(OPERATOR_MENUS_CHANGE_EVENT, bump);
      window.removeEventListener(USER_MENUS_CHANGE_EVENT, bump);
    };
  }, []);

  const value = useMemo(() => version, [version]);

  return (
    <CategoryRegistryContext.Provider value={value}>
      {children}
    </CategoryRegistryContext.Provider>
  );
}
